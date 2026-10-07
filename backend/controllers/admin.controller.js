const User = require('../models/User');
const Report = require('../models/Report');
const Resolution = require('../models/Resolution');

const { calculateGravityScore } = require('../utils/gravityScore');

// GET /api/admin/users — List all users
const getUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (role) filter.role = role;

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: users,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// PATCH /api/admin/users/:id/role — Update user role
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!['citizen', 'authority', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid role.' });
    }

    // Prevent self-demotion
    if (req.params.id === req.user.id) {
      return res.status(400).json({ success: false, error: 'Cannot change your own role.' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) return res.status(404).json({ success: false, error: 'User not found.' });

    res.json({ success: true, message: `User role updated to ${role}.`, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/admin/analytics — Platform analytics
const getAnalytics = async (req, res) => {
  try {
    const [
      totalReports,
      resolvedCount,
      pendingCount,
      inProgressCount,
      reportsByCategory,
      reportsByStatus,
      topReportedAreas,
      resolutions,
    ] = await Promise.all([
      Report.countDocuments(),
      Report.countDocuments({ status: 'resolved' }),
      Report.countDocuments({ status: 'pending' }),
      Report.countDocuments({ status: 'in_progress' }),

      Report.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $project: { category: '$_id', count: 1, _id: 0 } },
        { $sort: { count: -1 } },
      ]),

      Report.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $project: { status: '$_id', count: 1, _id: 0 } },
      ]),

      Report.aggregate([
        { $match: { address: { $ne: '' } } },
        { $group: { _id: '$address', count: { $sum: 1 } } },
        { $project: { address: '$_id', count: 1, _id: 0 } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),

      Resolution.find().select('resolvedAt reportId'),
    ]);

    // Calculate average resolution time in days
    let avgResolutionTime = 0;
    if (resolutions.length > 0) {
      const resolvedReports = await Report.find({
        _id: { $in: resolutions.map((r) => r.reportId) },
      }).select('createdAt');

      const reportMap = {};
      resolvedReports.forEach((r) => { reportMap[String(r._id)] = r.createdAt; });

      const totalDays = resolutions.reduce((sum, res) => {
        const created = reportMap[String(res.reportId)];
        if (!created) return sum;
        const days = (new Date(res.resolvedAt) - new Date(created)) / (1000 * 60 * 60 * 24);
        return sum + days;
      }, 0);

      avgResolutionTime = Math.round((totalDays / resolutions.length) * 10) / 10;
    }

    res.json({
      success: true,
      data: {
        totalReports,
        resolvedCount,
        pendingCount,
        inProgressCount,
        avgResolutionTime,
        reportsByCategory,
        reportsByStatus,
        topReportedAreas,
      },
    });
  } catch (error) {
    console.error('getAnalytics error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// DELETE /api/admin/users/:id — Delete user
const deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ success: false, error: 'Cannot delete yourself.' });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found.' });
    res.json({ success: true, message: 'User deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// PATCH /api/admin/reports/:id/status — Update report status as Admin
const updateReportStatus = async (req, res) => {
  try {
    const { status, note, imageUrl, estimatedDays } = req.body;

    if (!status || !['in_progress', 'resolved'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Status must be in_progress or resolved.' });
    }

    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, error: 'Report not found.' });

    report.status = status;
    report.assignedTo = req.user.id; // assigned to the admin
    if (estimatedDays !== undefined) {
      report.estimatedDays = estimatedDays;
    }
    report.gravityScore = calculateGravityScore(report);
    await report.save();

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
      data: populated,
      resolution,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { getUsers, updateUserRole, getAnalytics, deleteUser, updateReportStatus };
