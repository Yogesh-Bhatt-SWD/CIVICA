const express = require('express');
const router = express.Router();
const {
  createReport,
  getReports,
  getReportById,
  upvoteReport,
  deleteReport,
  getMyReports,
  recalculateScores,
  validateImage,
  getCategories,
} = require('../controllers/report.controller');
const { generateReportPdf } = require('../controllers/pdf.controller');
const verifyToken = require('../middleware/verifyToken');
const checkRole = require('../middleware/checkRole');

// All report routes require authentication
router.use(verifyToken);

router.get('/my', getMyReports);
router.get('/categories', getCategories);
router.get('/recalculate', checkRole(['admin']), recalculateScores);
router.post('/validate-image', checkRole(['citizen']), validateImage);
router.post('/', checkRole(['citizen']), createReport);
router.get('/', getReports);
router.get('/:id', getReportById);
router.get('/:id/pdf', generateReportPdf);
router.patch('/:id/upvote', checkRole(['citizen']), upvoteReport);
router.delete('/:id', deleteReport);

module.exports = router;
