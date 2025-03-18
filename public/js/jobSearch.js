// Job Search Module

// Function to get DOM elements after they're loaded
function getDOMElements() {
    return {
      jobSearchModal: document.getElementById('job-search-modal'),
      jobSearchForm: document.getElementById('job-search-form'),
      jobSearchResults: document.getElementById('job-search-results'),
      closeJobSearchBtn: document.querySelector('#job-search-modal .close-btn'),
      searchJobBtn: document.getElementById('search-job-btn'),
      loadingSpinner: document.getElementById('loading-spinner'),
      jobKeywordInput: document.getElementById('job-keyword'),
      jobLocationInput: document.getElementById('job-location'),
      jobResultsCount: document.getElementById('job-results-count'),
      paginationContainer: document.getElementById('pagination-container')
    };
  }
  
  // Initialize DOM elements
  let elements = {};
  
  // Global variables
  let currentPage = 1;
  let totalPages = 0;
  let jobsPerPage = 10;
  let currentJobs = [];
  let initialized = false;
  
  // Open job search modal
  function openJobSearchModal() {
    console.log("Opening job search modal");
    elements.jobSearchForm.reset();
    elements.jobSearchResults.innerHTML = '';
    elements.jobResultsCount.textContent = '';
    elements.paginationContainer.innerHTML = '';
    elements.jobSearchModal.classList.remove('hidden');
  }
  
  // Close job search modal
  function closeJobSearchModal() {
    elements.jobSearchModal.classList.add('hidden');
  }
  
  // Search for jobs
  async function searchJobs(e) {
    e.preventDefault();
    
    const keyword = elements.jobKeywordInput.value.trim();
    const location = elements.jobLocationInput.value.trim();
    
    if (!keyword) {
      // Display error if no keyword
      alert('Please enter a job title or keyword');
      return;
    }
    
    try {
      // Show loading spinner
      elements.loadingSpinner.classList.remove('hidden');
      elements.jobSearchResults.innerHTML = '';
      elements.jobResultsCount.textContent = '';
      elements.paginationContainer.innerHTML = '';
      
      // Make API request
      const response = await fetch(`/api/jobs/search?keyword=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}&page=${currentPage}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }
      
      const data = await response.json();
      currentJobs = data.jobs;
      
      // Hide loading spinner
      elements.loadingSpinner.classList.add('hidden');
      
      // Display results count
      elements.jobResultsCount.textContent = `Found ${data.totalJobs} jobs`;
      
      // Calculate pagination
      totalPages = Math.ceil(data.totalJobs / jobsPerPage);
      
      // Render jobs
      renderJobs(currentJobs);
      
      // Render pagination if needed
      if (totalPages > 1) {
        renderPagination();
      }
    } catch (error) {
      console.error('Error searching jobs:', error);
      elements.loadingSpinner.classList.add('hidden');
      elements.jobSearchResults.innerHTML = `<div class="error-message">Error searching for jobs. Please try again.</div>`;
    }
  }
  
  // Render jobs to results container
  function renderJobs(jobs) {
    elements.jobSearchResults.innerHTML = '';
    
    if (jobs.length === 0) {
      elements.jobSearchResults.innerHTML = '<div class="no-results">No jobs found. Try different keywords or location.</div>';
      return;
    }
    
    jobs.forEach(job => {
      const jobCard = document.createElement('div');
      jobCard.className = 'job-card';
      
      // Format date
      const postedDate = new Date(job.date).toLocaleDateString();
      
      // Create job description with limited length
      const description = job.description ? 
        (job.description.length > 200 ? job.description.substring(0, 200) + '...' : job.description) : 
        'No description available';
      
      jobCard.innerHTML = `
        <h3 class="job-title">${job.title}</h3>
        <div class="job-company">${job.company}</div>
        <div class="job-location">${job.location}</div>
        <div class="job-posted">Posted: ${postedDate}</div>
        <p class="job-description">${description}</p>
        <div class="job-card-actions">
          <a href="${job.url}" target="_blank" class="btn btn-small">View Details</a>
          <button class="btn btn-primary btn-small add-job-btn" data-job-index="${jobs.indexOf(job)}">
            Add to Applications
          </button>
        </div>
      `;
      
      elements.jobSearchResults.appendChild(jobCard);
    });
    
    // Add event listeners to "Add to Applications" buttons
    document.querySelectorAll('.add-job-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const jobIndex = parseInt(e.target.dataset.jobIndex);
        addJobToApplications(currentJobs[jobIndex]);
      });
    });
  }
  
  // Render pagination controls
  function renderPagination() {
    elements.paginationContainer.innerHTML = '';
    
    const prevButton = document.createElement('button');
    prevButton.className = 'btn btn-small pagination-btn';
    prevButton.innerText = 'Previous';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        jobSearchForm.dispatchEvent(new Event('submit'));
      }
    });
    
    const nextButton = document.createElement('button');
    nextButton.className = 'btn btn-small pagination-btn';
    nextButton.innerText = 'Next';
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage++;
        jobSearchForm.dispatchEvent(new Event('submit'));
      }
    });
    
    const pageInfo = document.createElement('span');
    pageInfo.className = 'pagination-info';
    pageInfo.innerText = `Page ${currentPage} of ${totalPages}`;
    
    elements.paginationContainer.appendChild(prevButton);
    elements.paginationContainer.appendChild(pageInfo);
    elements.paginationContainer.appendChild(nextButton);
  }
  
  // Add job to applications
  async function addJobToApplications(job) {
    try {
      // Prepare application data
      const applicationData = {
        company: job.company,
        website: job.url,
        jobTitle: job.title,
        applicationDate: new Date().toISOString().split('T')[0],
        status: 'Applied',
        notes: `Description: ${job.description || 'No description available'}\nLocation: ${job.location}`
      };
      
      // Send POST request to add application
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(applicationData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || 'Failed to add application');
      }
      
      // Close modal and reload applications
      closeJobSearchModal();
      window.applications.loadApplications();
      
      // Show success message
      alert('Job added to your applications!');
    } catch (error) {
      console.error('Error adding job to applications:', error);
      alert('Error adding job to applications. Please try again.');
    }
  }
  
  // Initialize event listeners
  function initEventListeners() {
    console.log("Initializing job search event listeners");
    elements = getDOMElements();
    
    if (elements.searchJobBtn) {
      elements.searchJobBtn.addEventListener('click', openJobSearchModal);
      console.log("Added event listener to search job button");
    } else {
      console.error("Search job button not found");
    }
    
    if (elements.closeJobSearchBtn) {
      elements.closeJobSearchBtn.addEventListener('click', closeJobSearchModal);
    }
    
    if (elements.jobSearchForm) {
      elements.jobSearchForm.addEventListener('submit', searchJobs);
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
      if (e.target === elements.jobSearchModal) {
        closeJobSearchModal();
      }
    });
    
    // Reset pagination when search parameters change
    if (elements.jobKeywordInput) {
      elements.jobKeywordInput.addEventListener('change', () => {
        currentPage = 1;
      });
    }
    
    if (elements.jobLocationInput) {
      elements.jobLocationInput.addEventListener('change', () => {
        currentPage = 1;
      });
    }
    
    initialized = true;
  }
  
  // Initialize when the document is fully loaded
  document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded, initializing job search module");
    initEventListeners();
  });
  
  // Export function to initialize job search functionality
  window.jobSearch = {
    init: function() {
      if (!initialized) {
        console.log("Initializing job search from external call");
        initEventListeners();
      }
    },
    openModal: function() {
      elements = getDOMElements();
      openJobSearchModal();
    }
  };
  
  // Make openJobSearchModal available globally for direct access
  window.openJobSearchModal = openJobSearchModal;