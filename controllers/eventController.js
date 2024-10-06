
const Event = require('../models/Event');
const User = require('../models/User');

// @desc    Create a new event
// @route   POST /api/events
// @access  Private
const createEvent = async (req, res) => {
  const { title, description, date, location, maxAttendees } = req.body;

  if (!title || !description || !date || !location || !maxAttendees) {
    res.status(400).json({ message: 'Please include all fields' });
    return;
  }

  const event = await Event.create({
    title,
    description,
    date,
    location,
    maxAttendees,
    image: req.file ? req.file.path : null,
    createdBy: req.user._id,
  });

  // Add event to user's createdEvents
  const user = await User.findById(req.user._id);
  user.createdEvents.push(event._id);
  await user.save();

  res.status(201).json(event);
};

// @desc    Get all upcoming events with filters
// @route   GET /api/events
// @access  Public
const getEvents = async (req, res) => {
  const { date, location, eventType } = req.query;
  let query = {};

  if (date) {
    // Assuming date is in YYYY-MM-DD format
    const start = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);
    query.date = { $gte: start, $lt: end };
  }

  if (location) {
    query.location = { $regex: location, $options: 'i' };
  }

  // Add eventType filter if applicable

  const events = await Event.find(query).populate('createdBy', 'name email');

  res.json(events);
};

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Public
const getEventById = async (req, res) => {
  const event = await Event.findById(req.params.id).populate(
    'createdBy',
    'name email'
  );

  if (event) {
    res.json(event);
  } else {
    res.status(404).json({ message: 'Event not found' });
  }
};

// @desc    Update an event
// @route   PUT /api/events/:id
// @access  Private
const updateEvent = async (req, res) => {
  const { title, description, date, location, maxAttendees } = req.body;

  const event = await Event.findById(req.params.id);

  if (!event) {
    res.status(404).json({ message: 'Event not found' });
    return;
  }

  // Check if the logged-in user is the creator
  if (event.createdBy.toString() !== req.user._id.toString()) {
    res.status(401).json({ message: 'Not authorized to update this event' });
    return;
  }

  event.title = title || event.title;
  event.description = description || event.description;
  event.date = date || event.date;
  event.location = location || event.location;
  event.maxAttendees = maxAttendees || event.maxAttendees;

  if (req.file) {
    event.image = req.file.path;
  }

  const updatedEvent = await event.save();
  res.json(updatedEvent);
};

// @desc    Delete an event
// @route   DELETE /api/events/:id
// @access  Private
const deleteEvent = async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    res.status(404).json({ message: 'Event not found' });
    return;
  }

  // Check if the logged-in user is the creator
  if (event.createdBy.toString() !== req.user._id.toString()) {
    res.status(401).json({ message: 'Not authorized to delete this event' });
    return;
  }

  await event.remove();

  // Remove event from user's createdEvents
  const user = await User.findById(req.user._id);
  user.createdEvents.pull(event._id);
  await user.save();

  res.json({ message: 'Event removed' });
};

// @desc    RSVP to an event
// @route   POST /api/events/:id/rsvp
// @access  Private
const rsvpEvent = async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    res.status(404).json({ message: 'Event not found' });
    return;
  }

  // Check if user already RSVP'd
  if (event.attendees.includes(req.user._id)) {
    res.status(400).json({ message: 'You have already RSVP’d to this event' });
    return;
  }

  // Check if max attendees reached
  if (event.attendees.length >= event.maxAttendees) {
    res.status(400).json({ message: 'Event is full' });
    return;
  }

  event.attendees.push(req.user._id);
  await event.save();

  res.json({ message: 'RSVP successful', event });
};

// @desc    Get user's RSVPs
// @route   GET /api/events/rsvps
// @access  Private
const getUserRSVPs = async (req, res) => {
  const events = await Event.find({ attendees: req.user._id }).populate(
    'createdBy',
    'name email'
  );

  res.json(events);
};

module.exports = {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  rsvpEvent,
  getUserRSVPs,
};
