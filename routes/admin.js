const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');
const AdminController = require('../controllers/AdminController');

router.use(requireAdmin);

router.get('/', (req, res) => res.redirect('/admin/dashboard'));
router.get('/dashboard', AdminController.getDashboard);

router.get('/participants', AdminController.getParticipants);
router.post('/participants', AdminController.postParticipant);

router.get('/venues', AdminController.getVenues);
router.post('/venues', AdminController.postVenue);
router.post('/venues/:id/update', AdminController.postUpdateVenue);
router.post('/venues/:id/delete', AdminController.postDeleteVenue);

router.get('/activities', AdminController.getActivities);
router.post('/activities', AdminController.postActivity);
router.post('/activities/:id/update', AdminController.postUpdateActivity);
router.post('/activities/:id/delete', AdminController.postDeleteActivity);

module.exports = router;
