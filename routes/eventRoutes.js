
const express = require('express');
const router = express.Router();
const {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  rsvpEvent,
  getUserRSVPs,
} = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../utils/upload');

// Public routes
router.get('/', getEvents);
router.get('/:id', getEventById);

// Protected routes
router.post('/', protect, upload.single('image'), createEvent);
router.put('/:id', protect, upload.single('image'), updateEvent);
router.delete('/:id', protect, deleteEvent);

// RSVP routes
router.post('/:id/rsvp', protect, rsvpEvent);
router.get('/rsvps/user', protect, getUserRSVPs);

module.exports = router;
