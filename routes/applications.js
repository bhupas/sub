const express = require('express');
const router = express.Router();
const Application = require('../models/Application');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  return res.status(401).json({ msg: 'Not authorized' });
};

// @route   GET /api/applications
// @desc    Get all applications for a user
// @access  Private
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const applications = await Application.find({ user: req.session.user.id }).sort({ applicationDate: -1 });
    res.json(applications);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/applications/:id
// @desc    Get application by ID
// @access  Private
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    
    // Check if application exists
    if (!application) {
      return res.status(404).json({ msg: 'Application not found' });
    }
    
    // Check if user owns the application
    if (application.user.toString() !== req.session.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    
    res.json(application);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Application not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST /api/applications
// @desc    Create a new application
// @access  Private
router.post('/', isAuthenticated, async (req, res) => {
  // Log the request body for debugging
  console.log('Request body:', req.body);
  
  const { company, website, jobTitle, applicationDate, status, followUpDate, notes } = req.body;
  
  try {
    // Create new application with explicit fields
    const newApplication = new Application({
      user: req.session.user.id,
      company,
      website, // Include website field explicitly
      jobTitle,
      applicationDate,
      status,
      followUpDate,
      notes
    });
    
    // Log the application before saving
    console.log('New application to save:', newApplication);
    
    const application = await newApplication.save();
    
    // Log the saved application
    console.log('Saved application:', application);
    
    res.json(application);
  } catch (err) {
    console.error('Error saving application:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT /api/applications/:id
// @desc    Update an application
// @access  Private
router.put('/:id', isAuthenticated, async (req, res) => {
  const { company, jobTitle, applicationDate, status, followUpDate, notes } = req.body;
  
  // Build application object
  const applicationFields = {};
  if (company) applicationFields.company = company;
  if (jobTitle) applicationFields.jobTitle = jobTitle;
  if (applicationDate) applicationFields.applicationDate = applicationDate;
  if (status) applicationFields.status = status;
  if (followUpDate) applicationFields.followUpDate = followUpDate;
  if (notes) applicationFields.notes = notes;
  
  try {
    let application = await Application.findById(req.params.id);
    
    // Check if application exists
    if (!application) {
      return res.status(404).json({ msg: 'Application not found' });
    }
    
    // Check if user owns the application
    if (application.user.toString() !== req.session.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    
    // Update
    application = await Application.findByIdAndUpdate(
      req.params.id,
      { $set: applicationFields },
      { new: true }
    );
    
    res.json(application);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Application not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   DELETE /api/applications/:id
// @desc    Delete an application
// @access  Private
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    
    // Check if application exists
    if (!application) {
      return res.status(404).json({ msg: 'Application not found' });
    }
    
    // Check if user owns the application
    if (application.user.toString() !== req.session.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    
    await application.remove();
    res.json({ msg: 'Application removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Application not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   GET /api/applications/filter
// @desc    Filter applications by status or company
// @access  Private
router.get('/filter/search', isAuthenticated, async (req, res) => {
  const { status, company } = req.query;
  
  try {
    let query = { user: req.session.user.id };
    
    if (status) {
      query.status = status;
    }
    
    if (company) {
      query.company = { $regex: company, $options: 'i' }; // Case-insensitive search
    }
    
    const applications = await Application.find(query).sort({ applicationDate: -1 });
    res.json(applications);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;