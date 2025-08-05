/**
 * JavaScript for teacher login page
 */

// Variables for storing elements
let loginForm, emailInput, passwordInput, passwordToggle, rememberMeCheckbox;
let loginBtn, loadingOverlay, connectionStatus;
let demoAccountBtns;

// Management variables
let loginAttempts = 0;
const maxLoginAttempts = 5;
let isSubmitting = false;

/**
 * Initialize system
 */
document.addEventListener('DOMContentLoaded', function() {
    initializeElements();
    initializeEventListeners();
    checkExistingSession();
    checkSystemConnection();
    setupFormValidation();
});

/**
 * Initialize elements
 */
function initializeElements() {
    // Form elements
    loginForm = document.getElementById('loginForm');
    emailInput = document.getElementById('email');
    passwordInput = document.getElementById('password');
    passwordToggle = document.getElementById('passwordToggle');
    rememberMeCheckbox = document.getElementById('rememberMe');
    loginBtn = document.getElementById('loginBtn');
    
    // UI elements
    loadingOverlay = document.getElementById('loadingOverlay');
    connectionStatus = document.getElementById('connectionStatus');
    
    // Demo account buttons
    demoAccountBtns = document.querySelectorAll('.demo-account-btn');
}

/**
 * Initialize event listeners
 */
function initializeEventListeners() {
    // Form submission
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Password toggle
    if (passwordToggle) {
        passwordToggle.addEventListener('click', togglePasswordVisibility);
    }
    
    // Demo account buttons
    demoAccountBtns.forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            const email = btn.dataset.email;
            const password = btn.dataset.password;
            fillDemoAccount(email, password);
        });
    });
    
    // Footer links
    const forgotPassword = document.getElementById('forgotPassword');
    const contactSupport = document.getElementById('contactSupport');
    const privacyPolicy = document.getElementById('privacyPolicy');
    const termsOfService = document.getElementById('termsOfService');
    const helpCenter = document.getElementById('helpCenter');
    
    if (forgotPassword) {
        forgotPassword.addEventListener('click', handleForgotPassword);
    }
    
    if (contactSupport) {
        contactSupport.addEventListener('click', handleContactSupport);
    }
    
    if (privacyPolicy) {
        privacyPolicy.addEventListener('click', handlePrivacyPolicy);
    }
    
    if (termsOfService) {
        termsOfService.addEventListener('click', handleTermsOfService);
    }
    
    if (helpCenter) {
        helpCenter.addEventListener('click', handleHelpCenter);
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Form input events
    if (emailInput) {
        emailInput.addEventListener('input', validateEmail);
        emailInput.addEventListener('blur', validateEmail);
    }
    
    if (passwordInput) {
        passwordInput.addEventListener('input', validatePassword);
        passwordInput.addEventListener('blur', validatePassword);
    }
}

/**
 * Check existing session
 */
function checkExistingSession() {
    const currentTeacher = SessionManager.getCurrentTeacher();
    
    if (currentTeacher) {
        // Has existing session, redirect to dashboard
        showLoginSuccess('Auto login successful', 'Welcome back ' + currentTeacher.name);
        setTimeout(function() {
            window.location.href = 'teacher-dashboard.html';
        }, 1500);
        return true;
    }
    
    // Check remember me
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail && emailInput) {
        emailInput.value = rememberedEmail;
        if (rememberMeCheckbox) {
            rememberMeCheckbox.checked = true;
        }
    }
    
    return false;
}

/**
 * Check system connection
 */
async function checkSystemConnection() {
    try {
        updateConnectionStatus('Checking...', 'checking');
        
        // Test connection to Google Sheets
        await SheetsAPI.fetchData(CONFIG.SHEETS.TEACHERS);
        
        updateConnectionStatus('Connected successfully', 'connected');
        
    } catch (error) {
        console.error('Connection check failed:', error);
        updateConnectionStatus('Connection failed', 'error');
        
        // Show error message
        Utils.showError(
            'Connection problem',
            'Cannot connect to system. Please check your internet connection.'
        );
    }
}

/**
 * Update connection status
 */
function updateConnectionStatus(message, status) {
    if (!connectionStatus) return;
    
    connectionStatus.textContent = message;
    
    // Update icon
    const statusIcon = connectionStatus.parentElement.querySelector('.status-icon');
    if (statusIcon) {
        statusIcon.className = 'fas fa-database status-icon';
        
        switch (status) {
            case 'connected':
                statusIcon.classList.add('online');
                break;
            case 'error':
                statusIcon.style.color = '#e53e3e';
                break;
            case 'checking':
                statusIcon.style.color = '#ed8936';
                break;
        }
    }
}

/**
 * Setup form validation
 */
function setupFormValidation() {
    // Set validation patterns
    if (emailInput) {
        emailInput.setAttribute('pattern', '[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$');
    }
    
    if (passwordInput) {
        passwordInput.setAttribute('minlength', '6');
    }
}

/**
 * Handle login form submission
 */
async function handleLogin(e) {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    // Check login attempts
    if (loginAttempts >= maxLoginAttempts) {
        Utils.showError(
            'Account locked',
            'You have tried to login incorrectly more than ' + maxLoginAttempts + ' times. Please wait 15 minutes and try again.'
        );
        return;
    }
    
    const formData = new FormData(loginForm);
    const email = formData.get('email') ? formData.get('email').trim() : '';
    const password = formData.get('password') || '';
    const rememberMe = formData.get('rememberMe') === 'on';
    
    // Validate form data
    if (!validateLoginForm(email, password)) {
        return;
    }
    
    try {
        isSubmitting = true;
        showLoading(true);
        updateLoginButton('Checking...', true);
        
        // Send data for authentication
        const result = await authenticateTeacher(email, password);
        
        if (result.success) {
            // Save session
            SessionManager.setCurrentTeacher(result.teacher);
            
            // Remember email if user chose to
            if (rememberMe) {
                localStorage.setItem('rememberedEmail', email);
            } else {
                localStorage.removeItem('rememberedEmail');
            }
            
            // Reset login attempts
            loginAttempts = 0;
            
            // Show success message
            showLoginSuccess('Login successful', 'Welcome ' + result.teacher.name);
            
            // Redirect after 1.5 seconds
            setTimeout(function() {
                window.location.href = 'teacher-dashboard.html';
            }, 1500);
            
        } else {
            throw new Error(result.message || 'Login failed');
        }
        
    } catch (error) {
        console.error('Login error:', error);
        loginAttempts++;
        
        let errorMessage = 'Incorrect email or password';
        
        if (error.message.includes('suspended')) {
            errorMessage = 'Your account has been suspended';
        } else if (error.message.includes('connection')) {
            errorMessage = 'Cannot connect to system';
        }
        
        Utils.showError('Login failed', errorMessage);
        
        // Shake login card
        shakeLoginCard();
        
        // Show remaining attempts
        const remainingAttempts = maxLoginAttempts - loginAttempts;
        if (remainingAttempts > 0 && remainingAttempts <= 2) {
            Utils.showAlert(
                'Warning',
                'You can try ' + remainingAttempts + ' more times',
                'warning'
            );
        }
        
    } finally {
        isSubmitting = false;
        showLoading(false);
        updateLoginButton('Login', false);
    }
}

/**
 * Validate login form
 */
function validateLoginForm(email, password) {
    let isValid = true;
    
    // Validate email
    if (!email) {
        showInputError(emailInput, 'Please enter email');
        isValid = false;
    } else if (!isValidEmail(email)) {
        showInputError(emailInput, 'Invalid email format');
        isValid = false;
    } else {
        clearInputError(emailInput);
    }
    
    // Validate password
    if (!password) {
        showInputError(passwordInput, 'Please enter password');
        isValid = false;
    } else if (password.length < 6) {
        showInputError(passwordInput, 'Password must be at least 6 characters');
        isValid = false;
    } else {
        clearInputError(passwordInput);
    }
    
    return isValid;
}

/**
 * Check email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Show input error
 */
function showInputError(input, message) {
    if (!input) return;
    
    input.style.borderColor = '#e53e3e';
    
    // Remove existing error
    clearInputError(input);
    
    // Add new error
    const errorElement = document.createElement('div');
    errorElement.className = 'input-error';
    errorElement.textContent = message;
    errorElement.style.color = '#e53e3e';
    errorElement.style.fontSize = '0.85rem';
    errorElement.style.marginTop = '0.5rem';
    
    input.parentElement.parentElement.appendChild(errorElement);
}

/**
 * Clear input error
 */
function clearInputError(input) {
    if (!input) return;
    
    input.style.borderColor = '#e2e8f0';
    
    const errorElement = input.parentElement.parentElement.querySelector('.input-error');
    if (errorElement) {
        errorElement.remove();
    }
}

/**
 * Authenticate teacher
 */
async function authenticateTeacher(email, password) {
    try {
        const result = await SheetsAPI.postData('authenticateTeacher', {
            email: email,
            password: password,
            loginTime: new Date().toISOString(),
            userAgent: navigator.userAgent,
            ipAddress: await getUserIP()
        });
        
        return {
            success: true,
            teacher: result.data
        };
        
    } catch (error) {
        return {
            success: false,
            message: error.message
        };
    }
}

/**
 * Get user IP address
 */
async function getUserIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        return 'unknown';
    }
}

/**
 * Toggle password visibility
 */
function togglePasswordVisibility() {
    if (!passwordInput || !passwordToggle) return;
    
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    
    const icon = passwordToggle.querySelector('i');
    if (icon) {
        icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
    }
}

/**
 * Fill demo account
 */
function fillDemoAccount(email, password) {
    if (emailInput) emailInput.value = email;
    if (passwordInput) passwordInput.value = password;
    
    // Add effects
    if (emailInput) emailInput.focus();
    setTimeout(function() {
        if (passwordInput) passwordInput.focus();
    }, 100);
    
    // Clear errors
    clearInputError(emailInput);
    clearInputError(passwordInput);
}

/**
 * Show loading
 */
function showLoading(show) {
    if (!loadingOverlay) return;
    
    if (show) {
        loadingOverlay.classList.add('active');
    } else {
        loadingOverlay.classList.remove('active');
    }
}

/**
 * Update login button
 */
function updateLoginButton(text, disabled) {
    if (!loginBtn) return;
    
    const btnText = loginBtn.querySelector('.btn-text');
    const btnIcon = loginBtn.querySelector('.btn-icon');
    
    if (btnText) btnText.textContent = text;
    if (btnIcon) btnIcon.style.display = disabled ? 'none' : 'inline';
    
    loginBtn.disabled = disabled;
}

/**
 * Show login success
 */
function showLoginSuccess(title, message) {
    Swal.fire({
        title: title,
        text: message,
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        timerProgressBar: true
    });
}

/**
 * Shake login card
 */
function shakeLoginCard() {
    const loginCard = document.querySelector('.login-card');
    if (loginCard) {
        loginCard.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(function() {
            loginCard.style.animation = '';
        }, 500);
    }
}

/**
 * Real-time input validation
 */
function validateEmail() {
    if (!emailInput) return;
    const email = emailInput.value.trim();
    
    if (email && !isValidEmail(email)) {
        showInputError(emailInput, 'Invalid email format');
    } else {
        clearInputError(emailInput);
    }
}

function validatePassword() {
    if (!passwordInput) return;
    const password = passwordInput.value;
    
    if (password && password.length < 6) {
        showInputError(passwordInput, 'Password must be at least 6 characters');
    } else {
        clearInputError(passwordInput);
    }
}

/**
 * Handle keyboard shortcuts
 */
function handleKeyboardShortcuts(e) {
    // Enter in input fields to submit form
    if (e.key === 'Enter' && (e.target === emailInput || e.target === passwordInput)) {
        e.preventDefault();
        if (loginForm) {
            loginForm.dispatchEvent(new Event('submit'));
        }
    }
    
    // Ctrl+1 for first demo account
    if (e.ctrlKey && e.key === '1') {
        e.preventDefault();
        const firstDemoBtn = demoAccountBtns[0];
        if (firstDemoBtn) {
            firstDemoBtn.click();
        }
    }
    
    // Ctrl+2 for second demo account
    if (e.ctrlKey && e.key === '2') {
        e.preventDefault();
        const secondDemoBtn = demoAccountBtns[1];
        if (secondDemoBtn) {
            secondDemoBtn.click();
        }
    }
}

/**
 * Handle various links
 */
function handleForgotPassword(e) {
    e.preventDefault();
    
    Swal.fire({
        title: 'Forgot Password',
        html: '<p>Please contact system administrator to reset your password</p><br><p><strong>Contact:</strong></p><p>📧 admin@school.com</p><p>📞 02-123-4567</p>',
        icon: 'info',
        confirmButtonText: 'OK',
        confirmButtonColor: '#667eea'
    });
}

function handleContactSupport(e) {
    e.preventDefault();
    
    Swal.fire({
        title: 'Contact Support',
        html: '<p>If you have any problems, please contact:</p><br><p><strong>IT Department</strong></p><p>📧 support@school.com</p><p>📞 02-123-4567 ext. 101</p><p>⏰ Mon-Fri 8:00-16:30</p>',
        icon: 'question',
        confirmButtonText: 'OK',
        confirmButtonColor: '#667eea'
    });
}

function handlePrivacyPolicy(e) {
    e.preventDefault();
    
    Swal.fire({
        title: 'Privacy Policy',
        html: '<div style="text-align: left; max-height: 300px; overflow-y: auto;"><h4>Data Collection</h4><p>We collect only necessary data for system operation</p><h4>Data Usage</h4><p>Data is used for educational purposes only</p><h4>Security</h4><p>We have appropriate security measures for data protection</p></div>',
        icon: 'info',
        confirmButtonText: 'OK',
        confirmButtonColor: '#667eea'
    });
}

function handleTermsOfService(e) {
    e.preventDefault();
    
    Swal.fire({
        title: 'Terms of Service',
        html: '<div style="text-align: left; max-height: 300px; overflow-y: auto;"><h4>System Usage</h4><p>Users must use the system for educational purposes only</p><h4>Responsibility</h4><p>Users must maintain account security</p><h4>Violations</h4><p>Inappropriate use may result in account suspension</p></div>',
        icon: 'info',
        confirmButtonText: 'OK',
        confirmButtonColor: '#667eea'
    });
}

function handleHelpCenter(e) {
    e.preventDefault();
    
    Swal.fire({
        title: 'Help Center',
        html: '<div style="text-align: left;"><h4>Frequently Asked Questions</h4><p><strong>Q:</strong> Forgot password?</p><p><strong>A:</strong> Contact administrator for reset</p><p><strong>Q:</strong> System not working?</p><p><strong>A:</strong> Check internet connection</p><p><strong>Q:</strong> Need user manual?</p><p><strong>A:</strong> Download from system after login</p></div>',
        icon: 'question',
        confirmButtonText: 'OK',
        confirmButtonColor: '#667eea'
    });
}

// Add CSS for shake animation
const style = document.createElement('style');
style.textContent = '@keyframes shake { 0%, 20%, 40%, 60%, 80%, 100% { transform: translateX(0); } 10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); } }';
document.head.appendChild(style);