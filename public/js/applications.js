// Applications Module

// DOM Elements
const applicationsTable = document.getElementById('applications-table');
const applicationsBody = document.getElementById('applications-body');
const noApplicationsMessage = document.getElementById('no-applications');
const addApplicationBtn = document.getElementById('add-application-btn');
const applicationModal = document.getElementById('application-modal');
const applicationForm = document.getElementById('application-form');
const modalTitle = document.getElementById('modal-title');
const closeBtn = document.querySelector('.close-btn');
const formError = document.getElementById('form-error');
const confirmModal = document.getElementById('confirm-modal');
const confirmDeleteBtn = document.getElementById('confirm-delete');
const cancelDeleteBtn = document.getElementById('cancel-delete');
const searchBtn = document.getElementById('search-btn');
const searchCompanyInput = document.getElementById('search-company');
const statusFilter = document.getElementById('status-filter');

// Global variables
let applications = [];
let currentApplicationId = null;

// Load all applications
async function loadApplications() {
  try {
    const response = await fetch('/api/applications');
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.msg || 'Failed to load applications');
    }
    
    applications = await response.json();
    renderApplications(applications);
  } catch (error) {
    console.error('Error loading applications:', error);
  }
}

// Render applications to table
function renderApplications(apps) {
  // Clear table body
  applicationsBody.innerHTML = '';
  
  if (apps.length === 0) {
    // Show no applications message
    applicationsTable.classList.add('hidden');
    noApplicationsMessage.classList.remove('hidden');
    return;
  }
  
  // Show table, hide message
  applicationsTable.classList.remove('hidden');
  noApplicationsMessage.classList.add('hidden');
  
  // Add each application to table
  apps.forEach(app => {
    const row = document.createElement('tr');
    
    // Format dates
    const applicationDate = new Date(app.applicationDate).toLocaleDateString();
    const followUpDate = app.followUpDate ? new Date(app.followUpDate).toLocaleDateString() : 'N/A';
    
    // Create company cell with website link if available
    let companyCell = app.company;
    if (app.website) {
      companyCell = `<a href="${app.website}" target="_blank" title="Visit company website">${app.company} <i class="fas fa-external-link-alt"></i></a>`;
    }
    
    // Set row content
    row.innerHTML = `
      <td>${companyCell}</td>
      <td>${app.jobTitle}</td>
      <td>${applicationDate}</td>
      <td>
        <span class="status-badge status-${app.status.toLowerCase()}">${app.status}</span>
      </td>
      <td>${followUpDate}</td>
      <td class="action-buttons">
        <button class="action-btn edit-btn" data-id="${app._id}" title="Edit">
          <i class="fas fa-edit"></i>
        </button>
        <button class="action-btn delete-btn" data-id="${app._id}" title="Delete">
          <i class="fas fa-trash-alt"></i>
        </button>
      </td>
    `;
    
    applicationsBody.appendChild(row);
  });
  
  // Add event listeners to edit and delete buttons
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => openEditModal(btn.dataset.id));
  });
  
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => openDeleteModal(btn.dataset.id));
  });
}

// Open modal to add new application
function openAddModal() {
  // Reset form
  applicationForm.reset();
  document.getElementById('application-id').value = '';
  
  // Set default date to today
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('application-date').value = today;
  
  // Update modal title
  modalTitle.textContent = 'Add New Application';
  
  // Clear error message
  formError.textContent = '';
  
  // Show modal
  applicationModal.classList.remove('hidden');
  
  // Set current application ID to null
  currentApplicationId = null;
}

// Open modal to edit application
function openEditModal(id) {
  // Find application
  const application = applications.find(app => app._id === id);
  
  if (!application) {
    console.error('Application not found');
    return;
  }
  
  // Fill form with application data
  document.getElementById('application-id').value = application._id;
  document.getElementById('company').value = application.company;
  
  // Handle website field (which might be new)
  const websiteEl = document.getElementById('website');
  if (websiteEl) {
    websiteEl.value = application.website || '';
  }
  
  document.getElementById('job-title').value = application.jobTitle;
  
  // Format dates for input fields
  const applicationDate = new Date(application.applicationDate).toISOString().split('T')[0];
  document.getElementById('application-date').value = applicationDate;
  
  document.getElementById('status').value = application.status;
  
  if (application.followUpDate) {
    const followUpDate = new Date(application.followUpDate).toISOString().split('T')[0];
    document.getElementById('follow-up-date').value = followUpDate;
  } else {
    document.getElementById('follow-up-date').value = '';
  }
  
  document.getElementById('notes').value = application.notes || '';
  
  // Update modal title
  modalTitle.textContent = 'Edit Application';
  
  // Clear error message
  formError.textContent = '';
  
  // Show modal
  applicationModal.classList.remove('hidden');
  
  // Set current application ID
  currentApplicationId = application._id;
}

// Open delete confirmation modal
function openDeleteModal(id) {
  currentApplicationId = id;
  confirmModal.classList.remove('hidden');
}

// Save application (create or update)
async function saveApplication(e) {
  e.preventDefault();
  
  try {
    // Clear error message
    formError.textContent = '';
    
    // Get form elements safely
    const companyEl = document.getElementById('company');
    const websiteEl = document.getElementById('website');
    const jobTitleEl = document.getElementById('job-title');
    const applicationDateEl = document.getElementById('application-date');
    const statusEl = document.getElementById('status');
    const followUpDateEl = document.getElementById('follow-up-date');
    const notesEl = document.getElementById('notes');
    
    // Log for debugging
    console.log('Form elements found:', {
      company: !!companyEl,
      website: !!websiteEl,
      jobTitle: !!jobTitleEl,
      applicationDate: !!applicationDateEl,
      status: !!statusEl,
      followUpDate: !!followUpDateEl,
      notes: !!notesEl
    });
    
    // Create application data safely
    const applicationData = {
      company: companyEl ? companyEl.value : '',
      website: websiteEl ? websiteEl.value : '',
      jobTitle: jobTitleEl ? jobTitleEl.value : '',
      applicationDate: applicationDateEl ? applicationDateEl.value : '',
      status: statusEl ? statusEl.value : 'Applied',
      followUpDate: followUpDateEl && followUpDateEl.value ? followUpDateEl.value : null,
      notes: notesEl ? notesEl.value : ''
    };
    
    // Validate required fields
    if (!applicationData.company || !applicationData.jobTitle || !applicationData.applicationDate || !applicationData.status) {
      throw new Error('Please fill in all required fields');
    }
    
    // Validate website format if entered
    if (applicationData.website && !isValidUrl(applicationData.website)) {
      throw new Error('Please enter a valid website URL (e.g., https://example.com)');
    }
    
    console.log('Submitting application data:', applicationData);
    
    let response;
    
    if (currentApplicationId) {
      // Update existing application
      response = await fetch(`/api/applications/${currentApplicationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(applicationData)
      });
    } else {
      // Create new application
      response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(applicationData)
      });
    }
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.msg || 'Failed to save application');
    }
    
    // Reload applications
    await loadApplications();
    
    // Close modal
    applicationModal.classList.add('hidden');
  } catch (error) {
    // Display error message
    formError.textContent = error.message;
    console.error('Save error:', error);
  }
}

// Helper function to validate URL
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// Delete application
async function deleteApplication() {
  try {
    const response = await fetch(`/api/applications/${currentApplicationId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.msg || 'Failed to delete application');
    }
    
    // Reload applications
    await loadApplications();
    
    // Close modal
    confirmModal.classList.add('hidden');
  } catch (error) {
    console.error('Error deleting application:', error);
  }
}

// Filter applications
async function filterApplications() {
  const company = searchCompanyInput.value.trim();
  const status = statusFilter.value;
  
  try {
    // Build query string
    const queryParams = [];
    if (company) queryParams.push(`company=${encodeURIComponent(company)}`);
    if (status) queryParams.push(`status=${encodeURIComponent(status)}`);
    
    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    
    // Fetch filtered applications
    const response = await fetch(`/api/applications/filter/search${queryString}`);
    
    if (!response.ok) {
      throw new Error('Failed to filter applications');
    }
    
    const filteredApplications = await response.json();
    
    // Update applications array and render
    applications = filteredApplications;
    renderApplications(applications);
  } catch (error) {
    console.error('Error filtering applications:', error);
  }
}

// Event Listeners
addApplicationBtn.addEventListener('click', openAddModal);
closeBtn.addEventListener('click', () => applicationModal.classList.add('hidden'));
applicationForm.addEventListener('submit', saveApplication);
confirmDeleteBtn.addEventListener('click', deleteApplication);
cancelDeleteBtn.addEventListener('click', () => confirmModal.classList.add('hidden'));
searchBtn.addEventListener('click', filterApplications);
statusFilter.addEventListener('change', filterApplications);

// Close modals when clicking outside
window.addEventListener('click', (e) => {
  if (e.target === applicationModal) {
    applicationModal.classList.add('hidden');
  }
  if (e.target === confirmModal) {
    confirmModal.classList.add('hidden');
  }
});

// Export functions
window.applications = {
  loadApplications
};