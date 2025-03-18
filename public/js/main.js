// Main Application Entry Point

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Check if user is logged in
  if (typeof window.auth !== 'undefined' && typeof window.auth.checkAuth === 'function') {
    window.auth.checkAuth();
  }
  
  // Add status badge styling
  addStatusBadgeStyles();
});

// Add CSS for status badges
function addStatusBadgeStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .status-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      text-align: center;
    }
    .status-applied {
      background-color: #e3f2fd;
      color: #0d47a1;
    }
    .status-interviewing {
      background-color: #fff8e1;
      color: #ff8f00;
    }
    .status-offer {
      background-color: #e8f5e9;
      color: #2e7d32;
    }
    .status-rejected {
      background-color: #ffebee;
      color: #c62828;
    }
  `;
  document.head.appendChild(style);
}