// Job Search Module - Improved version

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
      paginationContainer: document.getElementById('pagination-container'),
      locationFilterContainer: document.getElementById('location-filter-container'),
      locationFilterSelect: document.getElementById('location-filter')
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
  let allJobs = []; // Store all jobs for client-side filtering
  let uniqueLocations = []; // Store unique locations for filtering
  
  // Open job search modal
  function openJobSearchModal() {
    console.log("Opening job search modal");
    
    // Get fresh references to DOM elements
    elements = getDOMElements();
    
    // Reset form and results
    if (elements.jobSearchForm) elements.jobSearchForm.reset();
    if (elements.jobSearchResults) elements.jobSearchResults.innerHTML = '';
    if (elements.jobResultsCount) elements.jobResultsCount.textContent = '';
    if (elements.paginationContainer) elements.paginationContainer.innerHTML = '';
    
    // Make sure location filter container exists
    ensureLocationFilterExists();
    
    // Reset location filter
    if (elements.locationFilterSelect) {
      elements.locationFilterSelect.innerHTML = '<option value="">All Locations</option>';
      elements.locationFilterContainer.classList.add('hidden');
    }
    
    // Show modal
    if (elements.jobSearchModal) elements.jobSearchModal.classList.remove('hidden');
  }
  
  // Ensure the location filter exists in the DOM
  function ensureLocationFilterExists() {
    if (!document.getElementById('location-filter-container')) {
      addLocationFilter();
      
      // Update elements reference to include the new filter
      elements = getDOMElements();
    }
  }
  
  // Add location filter to the search modal
  function addLocationFilter() {
    console.log("Adding location filter to DOM");
    
    // Find the job search form
    const jobSearchForm = document.getElementById('job-search-form');
    if (!jobSearchForm) {
      console.error("Job search form not found");
      return;
    }
    
    // Create filter container
    const filterContainer = document.createElement('div');
    filterContainer.id = 'location-filter-container';
    filterContainer.className = 'form-group hidden';
    
    // Create filter HTML
    filterContainer.innerHTML = `
      <label for="location-filter">Filter by Location:</label>
      <select id="location-filter" class="form-control">
        <option value="">All Locations</option>
      </select>
    `;
    
    // Insert after the form
    jobSearchForm.insertAdjacentElement('afterend', filterContainer);
    
    // Add event listener to the filter
    const locationFilter = document.getElementById('location-filter');
    if (locationFilter) {
      locationFilter.addEventListener('change', filterJobsByLocation);
      console.log("Added event listener to location filter");
    }
  }
  
  // Close job search modal
  function closeJobSearchModal() {
    if (elements.jobSearchModal) {
      elements.jobSearchModal.classList.add('hidden');
    }
  }
  
  // Search for jobs
  async function searchJobs(e) {
    e.preventDefault();
    
    // Double-check we have references to all elements
    elements = getDOMElements();
    
    const keyword = elements.jobKeywordInput ? elements.jobKeywordInput.value.trim() : '';
    const location = elements.jobLocationInput ? elements.jobLocationInput.value.trim() : '';
    
    if (!keyword) {
      // Display error if no keyword
      alert('Please enter a job title or keyword');
      return;
    }
    
    try {
      // Show loading spinner
      if (elements.loadingSpinner) elements.loadingSpinner.classList.remove('hidden');
      if (elements.jobSearchResults) elements.jobSearchResults.innerHTML = '';
      if (elements.jobResultsCount) elements.jobResultsCount.textContent = '';
      if (elements.paginationContainer) elements.paginationContainer.innerHTML = '';
      
      // Make API request
      const response = await fetch(`/api/jobs/search?keyword=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}&page=${currentPage}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }
      
      const data = await response.json();
      allJobs = data.jobs; // Store all jobs for filtering
      currentJobs = data.jobs;
      
      // Hide loading spinner
      if (elements.loadingSpinner) elements.loadingSpinner.classList.add('hidden');
      
      // Extract unique locations for filtering
      uniqueLocations = [...new Set(allJobs.map(job => job.location))].sort();
      
      // Ensure the location filter exists
      ensureLocationFilterExists();
      
      // Populate location filter
      populateLocationFilter(uniqueLocations);
      
      // Display results count
      if (elements.jobResultsCount) {
        elements.jobResultsCount.textContent = `Found ${data.totalJobs} jobs`;
      }
      
      // Calculate pagination
      totalPages = Math.ceil(data.totalJobs / jobsPerPage);
      
      // Render jobs
      renderJobs(currentJobs);
      
      // Render pagination if needed
      if (totalPages > 1) {
        renderPagination();
      }
      
      // Show location filter if we have multiple locations
      if (uniqueLocations.length > 1 && elements.locationFilterContainer) {
        elements.locationFilterContainer.classList.remove('hidden');
        console.log("Showing location filter with options:", uniqueLocations);
      } else if (elements.locationFilterContainer) {
        elements.locationFilterContainer.classList.add('hidden');
      }
    } catch (error) {
      console.error('Error searching jobs:', error);
      if (elements.loadingSpinner) elements.loadingSpinner.classList.add('hidden');
      if (elements.jobSearchResults) {
        elements.jobSearchResults.innerHTML = `<div class="error-message">Error searching for jobs. Please try again.</div>`;
      }
    }
  }
  
  // Populate location filter dropdown
  function populateLocationFilter(locations) {
    if (!elements.locationFilterSelect) {
      console.error("Location filter select element not found");
      return;
    }
    
    console.log("Populating location filter with:", locations);
    
    // Clear existing options
    elements.locationFilterSelect.innerHTML = '<option value="">All Locations</option>';
    
    // Add new options
    locations.forEach(loc => {
      if (loc) { // Only add non-empty locations
        const option = document.createElement('option');
        option.value = loc;
        option.textContent = loc;
        elements.locationFilterSelect.appendChild(option);
      }
    });
  }
  
  // Filter jobs by location
  function filterJobsByLocation() {
    if (!elements.locationFilterSelect) {
      console.error("Location filter select element not found");
      return;
    }
    
    const selectedLocation = elements.locationFilterSelect.value;
    
    if (selectedLocation) {
      console.log("Filtering by location:", selectedLocation);
      currentJobs = allJobs.filter(job => job.location === selectedLocation);
    } else {
      console.log("Resetting to all jobs");
      currentJobs = [...allJobs]; // Reset to all jobs
    }
    
    // Update results count
    if (elements.jobResultsCount) {
      elements.jobResultsCount.textContent = `Showing ${currentJobs.length} of ${allJobs.length} jobs`;
    }
    
    // Render filtered jobs
    renderJobs(currentJobs);
  }
  
  // Render jobs to results container
  function renderJobs(jobs) {
    if (!elements.jobSearchResults) {
      console.error("Job search results container not found");
      return;
    }
    
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
      
      // Create truncated description for display (without HTML)
      let displayDescription = '';
      
      // Create temporary div to strip HTML
      const tempDiv = document.createElement('div');
      if (job.description) {
        tempDiv.innerHTML = job.description;
        displayDescription = tempDiv.textContent || 'No description available';
        
        // Truncate for display
        if (displayDescription.length > 200) {
          displayDescription = displayDescription.substring(0, 200) + '...';
        }
      } else {
        displayDescription = 'No description available';
      }
      
      jobCard.innerHTML = `
        <h3 class="job-title">${job.title}</h3>
        <div class="job-company">${job.company}</div>
        <div class="job-location">${job.location}</div>
        <div class="job-posted">Posted: ${postedDate}</div>
        <p class="job-description">${displayDescription}</p>
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
    if (!elements.paginationContainer) {
      console.error("Pagination container not found");
      return;
    }
    
    elements.paginationContainer.innerHTML = '';
    
    const prevButton = document.createElement('button');
    prevButton.className = 'btn btn-small pagination-btn';
    prevButton.innerText = 'Previous';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        elements.jobSearchForm.dispatchEvent(new Event('submit'));
      }
    });
    
    const nextButton = document.createElement('button');
    nextButton.className = 'btn btn-small pagination-btn';
    nextButton.innerText = 'Next';
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage++;
        elements.jobSearchForm.dispatchEvent(new Event('submit'));
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
 // Add job to applications - revised version with fix for website field
async function addJobToApplications(job) {
    try {
      // Log the job object to see what we're working with
      console.log("Job object received:", job);
      
      // Ensure the URL is in the proper format
      let websiteUrl = job.url || '';
      
      // Add https:// prefix if missing and URL is not empty
      if (websiteUrl && !websiteUrl.match(/^https?:\/\//)) {
        websiteUrl = 'https://' + websiteUrl;
      }
      
      // Prepare application data
      const applicationData = {
        company: job.company,
        website: websiteUrl, // Ensure we're using the formatted URL
        jobTitle: job.title,
        applicationDate: new Date().toISOString().split('T')[0],
        status: 'Applied',
        notes: '' // Empty notes as requested
      };
      
      console.log("Application data being sent to server:", applicationData);
      
      // Send POST request to add application
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(applicationData)
      });
      
      // Debug response
      console.log("Server response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || 'Failed to add application');
      }
      
      // Get the created application from response
      const createdApplication = await response.json();
      console.log("Created application:", createdApplication);
      
      // Close modal and reload applications
      closeJobSearchModal();
      if (window.applications && typeof window.applications.loadApplications === 'function') {
        window.applications.loadApplications();
      }
      
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
    
    // Get fresh references to DOM elements
    elements = getDOMElements();
    
    if (elements.searchJobBtn) {
      elements.searchJobBtn.addEventListener('click', openJobSearchModal);
      console.log("Added event listener to search job button");
    } else {
      console.error("Search job button not found");
    }
    
    if (elements.closeJobSearchBtn) {
      elements.closeJobSearchBtn.addEventListener('click', closeJobSearchModal);
      console.log("Added event listener to close button");
    } else {
      console.error("Close button not found");
    }
    
    if (elements.jobSearchForm) {
      elements.jobSearchForm.addEventListener('submit', searchJobs);
      console.log("Added event listener to job search form");
    } else {
      console.error("Job search form not found");
    }
    
    // Add location filter to the modal
    addLocationFilter();
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
      if (elements.jobSearchModal && e.target === elements.jobSearchModal) {
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
    console.log("Job search module initialized");
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
      } else {
        console.log("Job search already initialized");
      }
    },
    openModal: function() {
      elements = getDOMElements();
      openJobSearchModal();
    }
  };
  
  // Make openJobSearchModal available globally for direct access
  window.openJobSearchModal = openJobSearchModal;