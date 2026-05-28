const express = require('express');
const router = express.Router();
const { getActiveReports, updateReportStatus, getResolution } = require('../controllers/authority.controller');
const verifyToken = require('../middleware/verifyToken');
const checkRole = require('../middleware/checkRole');

router.use(verifyToken);
router.use(checkRole(['authority', 'admin']));

router.get('/reports', getActiveReports);
router.patch('/reports/:id/status', updateReportStatus);
router.get('/reports/:id/resolution', getResolution);

module.exports = router;
