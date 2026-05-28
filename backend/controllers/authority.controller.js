const Report = require('../models/Report');
const Resolution = require('../models/Resolution');
const { calculateGravityScore } = require('../utils/gravityScore');

// GET /api/authority/reports — All pending + in_progress reports sorted by gravityScore
const getActiveReports = async (req, res) => {
  try {
    const { category, status, page = 1, limit = 10, dateFrom, dateTo } = req.query;

    const filter = { status: { $in: ['pending', 'in_progress'] } };
    if (status && ['pending', 'in_progress'].includes(status)) filter.status = status;
    if (category) filter.category = category;
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

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
        hasNext: result.hasNextPage,
        hasPrev: result.hasPrevPage,
      },
    });
  } catch (error) {
    console.error('getActiveReports error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// PATCH /api/authority/reports/:id/status — Update report status
const updateReportStatus = async (req, res) => {
  try {
    const { status, note, imageUrl, estimatedDays } = req.body;

    if (!status || !['in_progress', 'resolved'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Status must be in_progress or resolved.' });
    }

    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, error: 'Report not found.' });

    report.status = status;
    report.assignedTo = req.user.id;
    if (estimatedDays !== undefined) {
      report.estimatedDays = estimatedDays;
    }
    report.gravityScore = calculateGravityScore(report);
    await report.save();

    // Create Resolution document on resolve
    let resolution = null;
    if (status === 'resolved') {
      resolution = await Resolution.create({
        reportId: report._id,
        authorityId: req.user.id,
        note: note || '',
        imageUrl: imageUrl || '',
      });
    }

    const populated = await Report.findById(report._id)
      .populate('submittedBy', 'name email')
      .populate('assignedTo', 'name email');

    res.json({
      success: true,
      message: `Report marked as ${status}.`,
      data: populated,
      resolution,
    });
  } catch (error) {
    console.error('updateReportStatus error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/authority/reports/:id/resolution — Get resolution for a report
const getResolution = async (req, res) => {
  try {
    const resolution = await Resolution.findOne({ reportId: req.params.id })
      .populate('authorityId', 'name email');

    if (!resolution) {
      return res.status(404).json({ success: false, error: 'No resolution found for this report.' });
    }

    res.json({ success: true, data: resolution });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { getActiveReports, updateReportStatus, getResolution };
