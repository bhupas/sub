const express = require('express');
const router = express.Router();
const axios = require('axios');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  return res.status(401).json({ msg: 'Not authorized' });
};

// Create a function to search jobs from various APIs
async function searchJobs(keyword, location, page = 1) {
  // We'll use multiple APIs for better coverage
  // Each API will have its own adapter function
  
  // Initialize result object
  const results = {
    jobs: [],
    totalJobs: 0
  };
  
  try {
    // Use Remotive API for remote jobs
    const remotive = await searchRemotive(keyword, page);
    
    // Merge results
    results.jobs = [...results.jobs, ...remotive.jobs];
    results.totalJobs += remotive.totalJobs;
    
    // You can add other job APIs here in the future
    // const gitHubJobs = await searchGitHubJobs(keyword, location, page);
    // results.jobs = [...results.jobs, ...gitHubJobs.jobs];
    // results.totalJobs += gitHubJobs.totalJobs;
    
    return results;
  } catch (error) {
    console.error('Job search error:', error);
    throw error;
  }
}

// Adapter for Remotive Jobs API
async function searchRemotive(keyword, page = 1) {
  try {
    // Remotive API doesn't support pagination with page numbers
    // We'll manually handle it
    const limit = 50; // Get more jobs to handle pagination manually
    
    const response = await axios.get('https://remotive.com/api/remote-jobs', {
      params: {
        search: keyword,
        limit: limit
      }
    });
    
    // Extract jobs from response
    const allJobs = response.data.jobs.map(job => ({
      id: job.id,
      title: job.title,
      company: job.company_name,
      location: job.candidate_required_location || 'Remote',
      description: job.description,
      url: job.url,
      date: job.publication_date
    }));
    
    // Calculate pagination
    const startIndex = (page - 1) * 10;
    const endIndex = page * 10;
    
    return {
      jobs: allJobs.slice(startIndex, endIndex),
      totalJobs: allJobs.length
    };
  } catch (error) {
    console.error('Remotive API error:', error);
    return { jobs: [], totalJobs: 0 };
  }
}

// @route   GET /api/jobs/search
// @desc    Search for jobs
// @access  Private
router.get('/search', isAuthenticated, async (req, res) => {
  const { keyword, location, page = 1 } = req.query;
  
  try {
    const results = await searchJobs(keyword, location, parseInt(page));
    res.json(results);
  } catch (error) {
    console.error('Error searching jobs:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;