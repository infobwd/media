/**
 * JavaScript สำหรับหน้าล็อกอินครู
 */

// ตัวแปรสำหรับเก็บ Elements
let loginForm, emailInput, passwordInput, passwordToggle, rememberMeCheckbox;
let loginBtn, loadingOverlay, connectionStatus;
let demoAccountBtns;

// ตัวแปรสำหรับการจัดการ
let loginAttempts = 0;
const maxLoginAttempts = 5;
let isSubmitting = false;

/**
 * เริ่มต้นระบบ
 */
document.addEventListener('DOMContentLoaded', function() {
    initializeElements();
    initializeEventListeners();
    checkExistingSession();
    checkSystemConnection();
    setupFormValidation();
});

/**
 * กำหนด Elements
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
 * กำหนด Event Listeners
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
    demoAccountBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
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
 * ตรวจสอบ Session ที่มีอยู่แล้ว
 */
function checkExistingSession() {
    const currentTeacher = SessionManager.getCurrentTeacher();
    
    if (currentTeacher) {
        // มี session อยู่แล้ว ให้ไปหน้า dashboard
        showLoginSuccess('เข้าสู่ระบบอัตโนมัติ', `ยินดีต้อนรับกลับ ${currentTeacher.name}`);
        setTimeout(() => {
            window.location.href = 'teacher-dashboard.html';
        }, 1500);
        return true;
    }
    
    // ตรวจสอบ remember me
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail && emailInput) {
        emailInput.value = rememberedEmail;
        rememberMeCheckbox.checked = true;
    }
    
    return false;
}

/**
 * ตรวจสอบการเชื่อมต่อระบบ
 */
async function checkSystemConnection() {
    try {
        updateConnectionStatus('กำลังตรวจสอบ...', 'checking');
        
        // ทดสอบการเชื่อมต่อ Google Sheets
        await SheetsAPI.fetchData(CONFIG.SHEETS.TEACHERS);
        
        updateConnectionStatus('เชื่อมต่อสำเร็จ', 'connected');
        
    } catch (error) {
        console.error('Connection check failed:', error);
        updateConnectionStatus('เชื่อมต่อไม่สำเร็จ', 'error');
        
        // แสดงข้อความแจ้งเตือน
        Utils.showError(
            'การเชื่อมต่อมีปัญหา',
            'ไม่สามารถเชื่อมต่อกับระบบได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต'
        );
    }
}

/**
 * อัปเดตสถานะการเชื่อมต่อ
 */
function updateConnectionStatus(message, status) {
    if (!connectionStatus) return;
    
    connectionStatus.textContent = message;
    
    // อัปเดตไอคอน
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
 * ตั้งค่าการตรวจสอบฟอร์ม
 */
function setupFormValidation() {
    // ตั้งค่า validation patterns
    if (emailInput) {
        emailInput.setAttribute('pattern', '[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,});
    }
    
    if (passwordInput) {
        passwordInput.setAttribute('minlength', '6');
    }
}

/**
 * จัดการการส่งฟอร์มล็อกอิน
 */
async function handleLogin(e) {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    // ตรวจสอบจำนวนครั้งที่พยายาม
    if (loginAttempts >= maxLoginAttempts) {
        Utils.showError(
            'ถูกล็อคการใช้งาน',
            `คุณพยายามเข้าสู่ระบบผิดเกิน ${maxLoginAttempts} ครั้ง กรุณารอ 15 นาทีแล้วลองใหม่`
        );
        return;
    }
    
    const formData = new FormData(loginForm);
    const email = formData.get('email')?.trim();
    const password = formData.get('password');
    const rememberMe = formData.get('rememberMe') === 'on';
    
    // ตรวจสอบข้อมูล
    if (!validateLoginForm(email, password)) {
        return;
    }
    
    try {
        isSubmitting = true;
        showLoading(true);
        updateLoginButton('กำลังตรวจสอบ...', true);
        
        // ส่งข้อมูลไปตรวจสอบ
        const result = await authenticateTeacher(email, password);
        
        if (result.success) {
            // บันทึก session
            SessionManager.setCurrentTeacher(result.teacher);
            
            // จดจำอีเมลถ้าผู้ใช้เลือก
            if (rememberMe) {
                localStorage.setItem('rememberedEmail', email);
            } else {
                localStorage.removeItem('rememberedEmail');
            }
            
            // รีเซ็ตจำนวนครั้งที่พยายาม
            loginAttempts = 0;
            
            // แสดงข้อความสำเร็จ
            showLoginSuccess('เข้าสู่ระบบสำเร็จ', `ยินดีต้อนรับ ${result.teacher.name}`);
            
            // เปลี่ยนหน้าหลังจาก 1.5 วินาที
            setTimeout(() => {
                window.location.href = 'teacher-dashboard.html';
            }, 1500);
            
        } else {
            throw new Error(result.message || 'การเข้าสู่ระบบล้มเหลว');
        }
        
    } catch (error) {
        console.error('Login error:', error);
        loginAttempts++;
        
        let errorMessage = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
        
        if (error.message.includes('ระงับ')) {
            errorMessage = 'บัญชีของคุณถูกระงับการใช้งาน';
        } else if (error.message.includes('เชื่อมต่อ')) {
            errorMessage = 'ไม่สามารถเชื่อมต่อกับระบบได้';
        }
        
        Utils.showError('เข้าสู่ระบบไม่สำเร็จ', errorMessage);
        
        // เขย่าฟอร์ม
        shakeLoginCard();
        
        // แสดงจำนวนครั้งที่เหลือ
        const remainingAttempts = maxLoginAttempts - loginAttempts;
        if (remainingAttempts > 0 && remainingAttempts <= 2) {
            Utils.showAlert(
                'คำเตือน',
                `คุณสามารถพยายามได้อีก ${remainingAttempts} ครั้ง`,
                'warning'
            );
        }
        
    } finally {
        isSubmitting = false;
        showLoading(false);
        updateLoginButton('เข้าสู่ระบบ', false);
    }
}

/**
 * ตรวจสอบข้อมูลการล็อกอิน
 */
function validateLoginForm(email, password) {
    let isValid = true;
    
    // ตรวจสอบอีเมล
    if (!email) {
        showInputError(emailInput, 'กรุณากรอกอีเมล');
        isValid = false;
    } else if (!isValidEmail(email)) {
        showInputError(emailInput, 'รูปแบบอีเมลไม่ถูกต้อง');
        isValid = false;
    } else {
        clearInputError(emailInput);
    }
    
    // ตรวจสอบรหัสผ่าน
    if (!password) {
        showInputError(passwordInput, 'กรุณากรอกรหัสผ่าน');
        isValid = false;
    } else if (password.length < 6) {
        showInputError(passwordInput, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
        isValid = false;
    } else {
        clearInputError(passwordInput);
    }
    
    return isValid;
}

/**
 * ตรวจสอบรูปแบบอีเมล
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * แสดงข้อผิดพลาดของ input
 */
function showInputError(input, message) {
    if (!input) return;
    
    input.style.borderColor = '#e53e3e';
    
    // ลบข้อผิดพลาดเดิม
    clearInputError(input);
    
    // เพิ่มข้อผิดพลาดใหม่
    const errorElement = document.createElement('div');
    errorElement.className = 'input-error';
    errorElement.textContent = message;
    errorElement.style.color = '#e53e3e';
    errorElement.style.fontSize = '0.85rem';
    errorElement.style.marginTop = '0.5rem';
    
    input.parentElement.parentElement.appendChild(errorElement);
}

/**
 * ล้างข้อผิดพลาดของ input
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
 * ตรวจสอบสิทธิ์ครู
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
 * ได้รับ IP Address ของผู้ใช้
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
 * แสดง/ซ่อนรหัสผ่าน
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
 * กรอกข้อมูลบัญชีทดสอบ
 */
function fillDemoAccount(email, password) {
    if (emailInput) emailInput.value = email;
    if (passwordInput) passwordInput.value = password;
    
    // เพิ่มเอฟเฟกต์
    emailInput?.focus();
    setTimeout(() => passwordInput?.focus(), 100);
    
    // ล้าง errors
    clearInputError(emailInput);
    clearInputError(passwordInput);
}

/**
 * แสดง Loading
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
 * อัปเดตปุ่มล็อกอิน
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
 * แสดงข้อความสำเร็จ
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
 * เขย่า Login Card
 */
function shakeLoginCard() {
    const loginCard = document.querySelector('.login-card');
    if (loginCard) {
        loginCard.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            loginCard.style.animation = '';
        }, 500);
    }
}

/**
 * การตรวจสอบ input แบบ real-time
 */
function validateEmail() {
    const email = emailInput?.value.trim();
    
    if (email && !isValidEmail(email)) {
        showInputError(emailInput, 'รูปแบบอีเมลไม่ถูกต้อง');
    } else {
        clearInputError(emailInput);
    }
}

function validatePassword() {
    const password = passwordInput?.value;
    
    if (password && password.length < 6) {
        showInputError(passwordInput, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
    } else {
        clearInputError(passwordInput);
    }
}

/**
 * จัดการ Keyboard Shortcuts
 */
function handleKeyboardShortcuts(e) {
    // Enter ในช่อง input เพื่อส่งฟอร์ม
    if (e.key === 'Enter' && (e.target === emailInput || e.target === passwordInput)) {
        e.preventDefault();
        loginForm?.dispatchEvent(new Event('submit'));
    }
    
    // Ctrl+1 สำหรับบัญชีทดสอบแรก
    if (e.ctrlKey && e.key === '1') {
        e.preventDefault();
        const firstDemoBtn = demoAccountBtns[0];
        if (firstDemoBtn) {
            firstDemoBtn.click();
        }
    }
    
    // Ctrl+2 สำหรับบัญชีทดสอบที่สอง
    if (e.ctrlKey && e.key === '2') {
        e.preventDefault();
        const secondDemoBtn = demoAccountBtns[1];
        if (secondDemoBtn) {
            secondDemoBtn.click();
        }
    }
}

/**
 * จัดการลิงก์ต่างๆ
 */
function handleForgotPassword(e) {
    e.preventDefault();
    
    Swal.fire({
        title: 'ลืมรหัสผ่าน',
        html: `
            <p>กรุณาติดต่อผู้ดูแลระบบเพื่อรีเซ็ตรหัสผ่าน</p>
            <br>
            <p><strong>ติดต่อ:</strong></p>
            <p>📧 admin@school.com</p>
            <p>📞 02-123-4567</p>
        `,
        icon: 'info',
        confirmButtonText: 'รับทราบ',
        confirmButtonColor: '#667eea'
    });
}

function handleContactSupport(e) {
    e.preventDefault();
    
    Swal.fire({
        title: 'ติดต่อฝ่ายสนับสนุน',
        html: `
            <p>หากคุณมีปัญหาการใช้งาน กรุณาติดต่อ:</p>
            <br>
            <p><strong>ฝ่าย IT โรงเรียนบ้านวังด้ง</strong></p>
            <p>📧 support@school.com</p>
            <p>📞 02-123-4567 ต่อ 101</p>
            <p>⏰ จันทร์-ศุกร์ 8:00-16:30 น.</p>
        `,
        icon: 'question',
        confirmButtonText: 'รับทราบ',
        confirmButtonColor: '#667eea'
    });
}

function handlePrivacyPolicy(e) {
    e.preventDefault();
    
    Swal.fire({
        title: 'นโยบายความเป็นส่วนตัว',
        html: `
            <div style="text-align: left; max-height: 300px; overflow-y: auto;">
                <h4>การเก็บรวบรวมข้อมูล</h4>
                <p>เราเก็บรวบรวมข้อมูลที่จำเป็นสำหรับการใช้งานระบบเท่านั้น</p>
                
                <h4>การใช้ข้อมูล</h4>
                <p>ข้อมูลจะใช้เพื่อการศึกษาและพัฒนาการเรียนการสอนเท่านั้น</p>
                
                <h4>การรักษาความปลอดภัย</h4>
                <p>เรามีมาตรการรักษาความปลอดภัยของข้อมูลอย่างเหมาะสม</p>
            </div>
        `,
        icon: 'info',
        confirmButtonText: 'รับทราบ',
        confirmButtonColor: '#667eea'
    });
}

function handleTermsOfService(e) {
    e.preventDefault();
    
    Swal.fire({
        title: 'ข้อกำหนดการใช้งาน',
        html: `
            <div style="text-align: left; max-height: 300px; overflow-y: auto;">
                <h4>การใช้งานระบบ</h4>
                <p>ผู้ใช้ต้องใช้งานระบบเพื่อการศึกษาเท่านั้น</p>
                
                <h4>ความรับผิดชอบ</h4>
                <p>ผู้ใช้ต้องรักษาความปลอดภัยของบัญชีผู้ใช้</p>
                
                <h4>การละเมิด</h4>
                <p>การใช้งานที่ไม่เหมาะสมอาจถูกระงับการใช้งาน</p>
            </div>
        `,
        icon: 'info',
        confirmButtonText: 'รับทราบ',
        confirmButtonColor: '#667eea'
    });
}

function handleHelpCenter(e) {
    e.preventDefault();
    
    Swal.fire({
        title: 'ศูนย์ช่วยเหลือ',
        html: `
            <div style="text-align: left;">
                <h4>คำถามที่พบบ่อย</h4>
                <p><strong>Q:</strong> ลืมรหัสผ่านทำอย่างไร?</p>
                <p><strong>A:</strong> ติดต่อผู้ดูแลระบบเพื่อรีเซ็ต</p>
                
                <p><strong>Q:</strong> ระบบใช้งานไม่ได้?</p>
                <p><strong>A:</strong> ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต</p>
                
                <p><strong>Q:</strong> ต้องการคู่มือการใช้งาน?</p>
                <p><strong>A:</strong> ดาวน์โหลดได้ในระบบหลังเข้าสู่ระบบ</p>
            </div>
        `,
        icon: 'question',
        confirmButtonText: 'รับทราบ',
        confirmButtonColor: '#667eea'
    });
}

// เพิ่ม CSS สำหรับ shake animation
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 20%, 40%, 60%, 80%, 100% {
            transform: translateX(0);
        }
        10%, 30%, 50%, 70%, 90% {
            transform: translateX(-5px);
        }
    }
`;
document.head.appendChild(style);