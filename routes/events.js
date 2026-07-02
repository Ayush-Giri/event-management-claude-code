const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const EventController = require('../controllers/EventController');

router.get('/', EventController.getIndex);
router.get('/create', requireAdmin, EventController.getCreate);
router.post('/', requireAdmin, upload.single('image'), EventController.postCreate);
router.get('/:id', EventController.getShow);
router.get('/:id/edit', requireAdmin, EventController.getEdit);
router.post('/:id', requireAdmin, upload.single('image'), EventController.postUpdate);
router.post('/:id/delete', requireAdmin, EventController.postDelete);
router.post('/:id/remove-image', requireAdmin, EventController.postRemoveImage);

module.exports = router;
