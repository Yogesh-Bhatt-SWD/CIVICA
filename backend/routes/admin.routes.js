const express = require('express');
const router = express.Router();
const { getUsers, updateUserRole, getAnalytics, deleteUser, updateReportStatus } = require('../controllers/admin.controller');
const verifyToken = require('../middleware/verifyToken');
const checkRole = require('../middleware/checkRole');

router.use(verifyToken);
router.use(checkRole(['admin']));

router.get('/users', getUsers);
router.patch('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);
router.get('/analytics', getAnalytics);
router.patch('/reports/:id/status', updateReportStatus);

module.exports = router;
