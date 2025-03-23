// Auth Module

// DOM Elements
const authContainer = document.getElementById('auth-container');
const mainContainer = document.getElementById('main-container');
const loginTab = document.getElementById('login-tab');
const registerTab = document.getElementById('register-tab');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const loginError = document.getElementById('login-error');
const registerError = document.getElementById('register-error');
const userNameDisplay = document.getElementById('user-name');
const logoutBtn = document.getElementById('logout-btn');

// Tab switching
loginTab.addEventListener('click', () => {
  loginTab.classList.add('active');
  registerTab.classList.remove('active');
  loginForm.classList.remove('hidden');
  registerForm.classList.add('hidden');
});

registerTab.addEventListener('click', () => {
  registerTab.classList.add('active');
  loginTab.classList.remove('active');
  registerForm.classList.remove('hidden');
  loginForm.classList.add('hidden');
});

// Register user
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const name = document.getElementById('register-name').value;
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;
  
  try {
    registerError.textContent = '';
    
    // Validate input on client side
    if (!name || !email || !password) {
      throw new Error('Please fill in all fields');
    }
    
    const response = await fetch('/api/users/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email, password })
    });
    
    // Check if response is ok before trying to parse JSON
    if (!response.ok) {
      const errorText = await response.text();
      try {
        // Try to parse as JSON
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.msg || 'Registration failed');
      } catch (jsonError) {
        // If can't parse as JSON, use text or default message
        throw new Error(errorText || 'Registration failed. Server returned an invalid response.');
      }
    }
    
    const data = await response.json();
    
    // Store user in localStorage
    localStorage.setItem('user', JSON.stringify(data));
    
    // Display user name
    userNameDisplay.textContent = data.name;
    
    // Switch to main container
    authContainer.classList.add('hidden');
    mainContainer.classList.remove('hidden');
    
    // Load applications
    if (window.applications && typeof window.applications.loadApplications === 'function') {
      window.applications.loadApplications();
    } else {
      console.error('loadApplications function not found');
    }
  } catch (error) {
    registerError.textContent = error.message;
    console.error('Registration error:', error);
  }
});

// Login user
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  
  try {
    loginError.textContent = '';
    
    // Validate input
    if (!email || !password) {
      throw new Error('Please fill in all fields');
    }
    
    const response = await fetch('/api/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    // Check if response is ok before trying to parse JSON
    if (!response.ok) {
      const errorText = await response.text();
      try {
        // Try to parse as JSON
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.msg || 'Login failed');
      } catch (jsonError) {
        // If can't parse as JSON, use text or default message
        throw new Error(errorText || 'Login failed. Server returned an invalid response.');
      }
    }
    
    const data = await response.json();
    
    // Store user in localStorage
    localStorage.setItem('user', JSON.stringify(data));
    
    // Display user name
    userNameDisplay.textContent = data.name;
    
    // Switch to main container
    authContainer.classList.add('hidden');
    mainContainer.classList.remove('hidden');
    
    // Load applications
    if (window.applications && typeof window.applications.loadApplications === 'function') {
      window.applications.loadApplications();
    } else {
      console.error('loadApplications function not found');
    }
  } catch (error) {
    loginError.textContent = error.message;
    console.error('Login error:', error);
  }
});

// Logout user
logoutBtn.addEventListener('click', async () => {
  try {
    const response = await fetch('/api/users/logout');
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Logout failed';
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.msg || errorMessage;
      } catch (e) {
        // If parsing fails, use the error text
        errorMessage = errorText || errorMessage;
      }
      
      throw new Error(errorMessage);
    }
    
    // Clear localStorage
    localStorage.removeItem('user');
    
    // Switch to auth container
    mainContainer.classList.add('hidden');
    authContainer.classList.remove('hidden');
    
    // Clear forms
    loginForm.reset();
    registerForm.reset();
    loginError.textContent = '';
    registerError.textContent = '';
  } catch (error) {
    console.error('Logout error:', error);
    alert('Error during logout: ' + error.message);
  }
});

// Check if user is logged in on page load
function checkAuth() {
  const user = JSON.parse(localStorage.getItem('user'));
  
  if (user) {
    // Verify session is still valid
    fetch('/api/users/me')
      .then(response => {
        if (response.ok) {
          return response.json();
        } else {
          // Session expired, clear localStorage
          localStorage.removeItem('user');
          throw new Error('Session expired');
        }
      })
      .then(data => {
        // Display user name
        userNameDisplay.textContent = data.name;
        
        // Switch to main container
        authContainer.classList.add('hidden');
        mainContainer.classList.remove('hidden');
        
        // Load applications
        if (window.applications && typeof window.applications.loadApplications === 'function') {
          window.applications.loadApplications();
        } else {
          console.error('loadApplications function not found');
        }
      })
      .catch(error => {
        console.error('Auth check error:', error);
      });
  }
}

// Export functions
window.auth = {
  checkAuth
};