const express = require('express');
const router = express.Router();
const { requireLogin } = require('../middleware/auth');
const RegistrationController = require('../controllers/RegistrationController');

router.use(requireLogin);

router.get('/my-registrations', RegistrationController.getMyRegistrations);
router.post('/events/:id/register', RegistrationController.postRegister);
router.post('/events/:id/unregister', RegistrationController.postUnregister);

module.exports = router;
