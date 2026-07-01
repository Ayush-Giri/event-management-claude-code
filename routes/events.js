const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');
const EventController = require('../controllers/EventController');

router.get('/', EventController.getIndex);
router.get('/create', requireAdmin, EventController.getCreate);
router.post('/', requireAdmin, EventController.postCreate);
router.get('/:id', EventController.getShow);
router.get('/:id/edit', requireAdmin, EventController.getEdit);
router.post('/:id', requireAdmin, EventController.postUpdate);
router.post('/:id/delete', requireAdmin, EventController.postDelete);

module.exports = router;
