const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const AdminController = require('../controllers/AdminController');

router.use(requireAdmin);

router.get('/', (req, res) => res.redirect('/admin/dashboard'));
router.get('/dashboard', AdminController.getDashboard);

router.get('/participants', AdminController.getParticipants);
router.post('/participants', AdminController.postParticipant);

router.get('/venues', AdminController.getVenues);
router.post('/venues', upload.single('image'), AdminController.postVenue);
router.post('/venues/:id/update', upload.single('image'), AdminController.postUpdateVenue);
router.post('/venues/:id/delete', AdminController.postDeleteVenue);
router.post('/venues/:id/remove-image', AdminController.postRemoveVenueImage);

router.get('/activities', AdminController.getActivities);
router.post('/activities', upload.single('image'), AdminController.postActivity);
router.post('/activities/:id/update', upload.single('image'), AdminController.postUpdateActivity);
router.post('/activities/:id/delete', AdminController.postDeleteActivity);
router.post('/activities/:id/remove-image', AdminController.postRemoveActivityImage);

module.exports = router;
