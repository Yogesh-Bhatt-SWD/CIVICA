const axios = require('axios');
const Report = require('../models/Report');
const { calculateGravityScore } = require('../utils/gravityScore');
const { buildNearQuery } = require('../utils/geoUtils');

// GET /api/reports/categories — Dynamically fetch categories from AI service
const getCategories = async (req, res) => {
  try {
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://127.0.0.1:5001';
    const aiRes = await axios.get(`${aiServiceUrl}/health`, { timeout: 3000 });
    
    if (aiRes.data && aiRes.data.classes && aiRes.data.classes.length > 0) {
      return res.json({ success: true, categories: aiRes.data.classes });
    }
  } catch (err) {
    console.warn('AI offline or unreachable, falling back to static categories');
  }

  // Fallback to exactly what the AI was trained on
  return res.json({ 
    success: true, 
    categories: ['FallenTrees', 'DamagedElectricalPoles', 'Potholes and RoadCracks', 'Garbage'] 
  });
};

// POST /api/reports — Create new report
const createReport = async (req, res) => {
  try {
    const { title, description, category, latitude, longitude, address, state, severity } = req.body;
    let imageUrl = req.body.imageUrl || '';

    if (!title || !category || !latitude || !longitude) {
      return res.status(400).json({ success: false, error: 'Title, category and location are required.' });
    }

    // Handle image and AI validation
    if (req.files && req.files.image) {
      const file = req.files.image;

      // --- Step 1: AI Validation BEFORE file move ---
      let aiValidated = false;
      let aiData = { valid: false, message: "AI Service Offline" };

      try {
        const FormData = require('form-data');
        const form = new FormData();
        form.append('image', file.data, { filename: file.name, contentType: file.mimetype });
        form.append('category', category);

        const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://127.0.0.1:5001';
        console.log(`Requesting AI Validation (${category})...`);
        
        const aiResponse = await axios.post(`${aiServiceUrl}/validate`, form, {
          headers: form.getHeaders(),
          timeout: 20000, // 20s timeout for model loading
        });
        
        aiData = aiResponse.data;
        aiValidated = aiData.valid;

        // Strict rejection ONLY if AI is UP and it explicitly rejected the image
        if (!aiData.valid && !aiData.isDown) {
          console.warn(`[AI REJECTED] Category: ${category}, Message: ${aiData.message}`);
          return res.status(400).json({
            success: false,
            error: aiData.message || 'AI could not validate this image for the selected category.',
            aiData,
          });
        }
        
        if (aiData.isDown) {
          console.warn(`[AI OFFLINE] Allowing manual submission for ${category}`);
        } else {
          console.log(`AI VALIDATED: ${category} (conf: ${aiData.confidence})`);
        }

      } catch (aiError) {
        const isConnError = aiError.code === 'ECONNREFUSED' || aiError.code === 'ETIMEDOUT' || !aiError.response;
        console.error(`AI service error (${isConnError ? 'OFFLINE' : 'ERROR'}):`, aiError.message);
        
        aiValidated = false;
        aiData = { 
          valid: false, 
          message: isConnError ? "AI validation service is currently offline. Manual review required." : `AI service error: ${aiError.message}`,
          isDown: isConnError 
        };
      }

      // --- Step 1.1: File storage ---
      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
      const path = require('path');
      const uploadPath = path.join(__dirname, '../uploads', fileName);
      await file.mv(uploadPath);
      imageUrl = `http://localhost:5000/uploads/${fileName}`;

    } else {
      // ENFORCE: All categories MUST provide an image for AI validation
      return res.status(400).json({ 
        success: false, 
        error: "An image is required for AI validation." 
      });
    }

    const lng = parseFloat(longitude);
    const lat = parseFloat(latitude);

    // Step 2: Geospatial duplicate detection (100m radius, same category)
    const duplicate = await Report.findOne({
      location: { ...buildNearQuery(lng, lat, 100) },
      category,
      status: { $ne: 'resolved' },
    }).populate('submittedBy', 'name email');

    if (duplicate) {
      // Check if this user already upvoted
      const alreadyUpvoted = duplicate.upvotedBy.includes(req.user.id);
      if (!alreadyUpvoted) {
        duplicate.upvotes += 1;
        duplicate.upvotedBy.push(req.user.id);
      }
      duplicate.gravityScore = calculateGravityScore(duplicate);
      await duplicate.save();

      return res.status(200).json({
        success: true,
        duplicate: true,
        message: 'Similar issue already reported nearby. Your upvote has been added!',
        data: duplicate,
      });
    }

    // Step 3: Save new report
    let severityNum = Math.min(5, Math.max(1, parseInt(severity) || 3));

    // --- Smart Severity Detection ---
    if (req.aiData && req.aiData.boundingBox) {
      const [xmin, ymin, xmax, ymax] = req.aiData.boundingBox;
      const area = (xmax - xmin) * (ymax - ymin);
      // Boost to critical (5) if object takes > 15% of frame OR confidence > 0.8
      if (area > 0.15 || req.aiData.confidence > 0.80) {
        severityNum = 5;
      }
    }

    const newReport = new Report({
      title: title.trim(),
      description: description?.trim() || '',
      category,
      imageUrl: imageUrl || '',
      location: {
        type: 'Point',
        coordinates: [lng, lat],
      },
      address: address?.trim() || '',
      state: state?.trim() || '',
      severity: severityNum,
      submittedBy: req.user.id,
      aiValidated: req.aiData?.valid || false,
      aiConfidence: req.aiData?.confidence || null,
      aiBoundingBox: req.aiData?.boundingBox || null,
    });

    // Step 4: Calculate initial gravity score
    newReport.gravityScore = calculateGravityScore(newReport);
    await newReport.save();

    const populated = await Report.findById(newReport._id).populate('submittedBy', 'name email');

    res.status(201).json({
      success: true,
      duplicate: false,
      message: 'Report submitted successfully.',
      data: populated,
    });
  } catch (error) {
    console.error('createReport error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/reports — Get all reports (paginated, filtered)
const getReports = async (req, res) => {
  try {
    const { status, category, severity, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (status) {
      filter.status = status;
    } else if (req.user && req.user.role === 'citizen') {
      // Citizens only see active issues by default
      filter.status = { $ne: 'resolved' };
    }

    if (category) filter.category = category;
    if (severity) filter.severity = parseInt(severity);

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { gravityScore: -1 },
      populate: [
        { path: 'submittedBy', select: 'name email' },
        { path: 'assignedTo', select: 'name email' },
      ],
    };

    const result = await Report.paginate(filter, options);

    res.json({
      success: true,
      data: result.docs,
      pagination: {
        total: result.totalDocs,
        page: result.page,
        pages: result.totalPages,
        limit: result.limit,
        hasNext: result.hasNextPage,
        hasPrev: result.hasPrevPage,
      },
    });
  } catch (error) {
    console.error('getReports error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/reports/:id — Get single report
const getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('submittedBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('mergedWith', 'title status');

    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found.' });
    }

    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// PATCH /api/reports/:id/upvote — Toggle upvote
const upvoteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, error: 'Report not found.' });

    const userId = req.user.id;
    const alreadyUpvoted = report.upvotedBy.map(String).includes(userId);

    if (alreadyUpvoted) {
      // Remove upvote
      report.upvotedBy = report.upvotedBy.filter((id) => String(id) !== userId);
      report.upvotes = Math.max(0, report.upvotes - 1);
    } else {
      // Add upvote
      report.upvotedBy.push(userId);
      report.upvotes += 1;
    }

    report.gravityScore = calculateGravityScore(report);
    await report.save();

    res.json({
      success: true,
      message: alreadyUpvoted ? 'Upvote removed.' : 'Upvoted successfully.',
      data: { upvotes: report.upvotes, gravityScore: report.gravityScore, hasUpvoted: !alreadyUpvoted },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// DELETE /api/reports/:id — Delete report
const deleteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, error: 'Report not found.' });

    // Only owner or admin can delete
    if (String(report.submittedBy) !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'You can only delete your own reports.' });
    }

    await report.deleteOne();
    res.json({ success: true, message: 'Report deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/reports/my — Get current user's reports
const getMyReports = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const filter = { submittedBy: req.user.id };
    if (status) {
      filter.status = status;
    } else if (req.user.role === 'citizen') {
      // Hide resolved reports from citizen's personal list by default
      filter.status = { $ne: 'resolved' };
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: { path: 'submittedBy', select: 'name email' },
    };

    const result = await Report.paginate(filter, options);

    res.json({
      success: true,
      data: result.docs,
      pagination: {
        total: result.totalDocs,
        page: result.page,
        pages: result.totalPages,
        hasNext: result.hasNextPage,
        hasPrev: result.hasPrevPage,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/reports/recalculate — Admin: recalculate all gravity scores
const recalculateScores = async (req, res) => {
  try {
    const reports = await Report.find({ status: { $ne: 'resolved' } });
    const updates = reports.map((r) => {
      r.gravityScore = calculateGravityScore(r);
      return r.save();
    });
    await Promise.all(updates);
    res.json({ success: true, message: `Recalculated gravity scores for ${reports.length} reports.` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Validate an image without creating a report
 * Proxies to AI service for real-time frontend feedback
 */
const validateImage = async (req, res) => {
  try {
    if (!req.files || !req.files.image) {
      return res.status(400).json({ success: false, error: 'No image provided' });
    }

    const file = req.files.image;
    const { category } = req.body;
    const { threshold } = req.query;

    const FormData = require('form-data');
    const form = new FormData();
    form.append('image', file.data, { filename: file.name, contentType: file.mimetype });
    if (category) form.append('category', category);

    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://127.0.0.1:5001';
    let url = `${aiServiceUrl}/validate`;
    if (threshold) url += `?threshold=${threshold}`;

    const aiResponse = await axios.post(url, form, {
      headers: form.getHeaders(),
      timeout: 20000, // 20s timeout for model loading
    });

    res.json({
      success: true,
      aiData: aiResponse.data
    });
  } catch (err) {
    const isConnError = err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT' || !err.response;
    console.error(`AI Proxy Error (${isConnError ? 'OFFLINE' : 'SERVER_ERROR'}):`, err.message);
    
    res.status(isConnError ? 502 : 500).json({
      success: false,
      error: isConnError ? 'AI service connection failed' : 'AI service internal error',
      message: isConnError ? 'AI validation is currently offline. You can still submit your report.' : `AI error: ${err.message}`,
      isDown: isConnError
    });
  }
};

module.exports = { createReport, getReports, getReportById, upvoteReport, deleteReport, getMyReports, recalculateScores, validateImage, getCategories };
