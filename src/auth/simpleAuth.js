// Simple authentication system with security features
// Username: test
// Password: demoacctforGearshiftFellowship

const VALID_USERNAME = 'test';
const VALID_PASSWORD = 'demoacctforGearshiftFellowship';
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 300000; // 5 minutes in ms

// Rate limiting state
let loginAttempts = 0;
let lockoutUntil = null;

/**
 * Sanitize input to prevent XSS
 * @param {string} input
 * @returns {string}
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  return input
    .trim()
    .replace(/[<>"'&]/g, (char) => {
      const entities = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;',
      };
      return entities[char] || char;
    })
    .slice(0, 100); // Max length to prevent DoS
}

/**
 * Check if login is currently locked out
 * @returns {boolean}
 */
function isLockedOut() {
  if (!lockoutUntil) return false;
  if (Date.now() < lockoutUntil) return true;
  // Reset if lockout expired
  lockoutUntil = null;
  loginAttempts = 0;
  return false;
}

export function showLoginScreen() {
  return new Promise((resolve, reject) => {
    // Check if user is already logged in (within 1 hour)
    const existingUserId = localStorage.getItem('acct_user_id');
    const loginTime = localStorage.getItem('acct_login_time');

    if (existingUserId && loginTime) {
      const loginTimestamp = new Date(loginTime).getTime();
      const now = Date.now();
      const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds

      if (now - loginTimestamp < oneHour) {
        resolve(existingUserId);
        return;
      }
    }

    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    overlay.innerHTML = `
      <div style="max-width: 400px; width: 100%; padding: 2rem;">
        <h2 style="text-align: center; margin-bottom: 2rem; color: #0a0a0a;">
          Adaptive Cognitive Control Task
        </h2>
        <form id="login-form" style="display: flex; flex-direction: column; gap: 1rem;" aria-label="Login form">
          <div>
            <label for="username-input" style="display: block; margin-bottom: 0.5rem; color: #404040; font-size: 0.875rem;">
              Username
            </label>
            <input
              type="text"
              id="username-input"
              name="username"
              aria-required="true"
              aria-label="Username"
              style="width: 100%; padding: 0.5rem; border: 1px solid #e5e5e5; border-radius: 0.375rem; font-size: 0.875rem;"
              autocomplete="off"
            />
          </div>
          <div>
            <label for="password-input" style="display: block; margin-bottom: 0.5rem; color: #404040; font-size: 0.875rem;">
              Password
            </label>
            <input
              type="password"
              id="password-input"
              name="password"
              aria-required="true"
              aria-label="Password"
              style="width: 100%; padding: 0.5rem; border: 1px solid #e5e5e5; border-radius: 0.375rem; font-size: 0.875rem;"
            />
          </div>
          <div id="error-message" role="alert" aria-live="polite" style="color: #dc2626; font-size: 0.875rem; display: none;"></div>
          <button
            type="submit"
            aria-label="Login to experiment"
            style="background: #0a0a0a; color: #ffffff; padding: 0.5rem 1rem; border: none; border-radius: 0.375rem; cursor: pointer; font-size: 0.875rem; font-weight: 500;"
          >
            Login
          </button>
        </form>
        
      </div>
    `;

    document.body.appendChild(overlay);

    const form = document.getElementById('login-form');
    const usernameInput = document.getElementById('username-input');
    const passwordInput = document.getElementById('password-input');
    const errorMessage = document.getElementById('error-message');

    usernameInput.focus();

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      // Check rate limiting
      if (isLockedOut()) {
        const remainingTime = Math.ceil((lockoutUntil - Date.now()) / 1000);
        errorMessage.textContent = `Too many failed attempts. Try again in ${remainingTime} seconds.`;
        errorMessage.style.display = 'block';
        return;
      }

      // Sanitize inputs
      const username = sanitizeInput(usernameInput.value);
      const password = passwordInput.value;

      // Validate input lengths
      if (!username || !password) {
        errorMessage.textContent = 'Username and password are required';
        errorMessage.style.display = 'block';
        return;
      }

      if (password.length > 100) {
        errorMessage.textContent = 'Invalid credentials';
        errorMessage.style.display = 'block';
        return;
      }

      // Check credentials
      if (username === VALID_USERNAME && password === VALID_PASSWORD) {
        // Reset rate limiting on success
        loginAttempts = 0;
        lockoutUntil = null;

        // Generate secure unique user ID
        const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Store in localStorage (sanitized)
        localStorage.setItem('acct_user_id', userId);
        localStorage.setItem('acct_username', username);
        localStorage.setItem('acct_login_time', new Date().toISOString());

        // Remove login screen
        overlay.remove();
        resolve(userId);
      } else {
        // Increment failed attempts
        loginAttempts++;

        // Lock out after max attempts
        if (loginAttempts >= MAX_LOGIN_ATTEMPTS) {
          lockoutUntil = Date.now() + LOCKOUT_DURATION;
          errorMessage.textContent = `Too many failed attempts. Locked out for 5 minutes.`;
        } else {
          const remainingAttempts = MAX_LOGIN_ATTEMPTS - loginAttempts;
          errorMessage.textContent = `Invalid credentials. ${remainingAttempts} attempts remaining.`;
        }

        errorMessage.style.display = 'block';
        passwordInput.value = '';
        passwordInput.focus();
      }
    });
  });
}

export function getCurrentUserId() {
  return localStorage.getItem('acct_user_id');
}

export function logout() {
  localStorage.removeItem('acct_user_id');
  localStorage.removeItem('acct_username');
  localStorage.removeItem('acct_login_time');
}
