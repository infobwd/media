/**
 * ฟังก์ชันที่ใช้ร่วมกันทั้งระบบ
 * สำหรับการเชื่อมต่อ Google Sheets และการจัดการข้อมูล
 */

// กำหนดค่าคงที่
const CONFIG = {
    SPREADSHEET_ID: '1YVZV9IN3K1bIXO0am28DHXONnQWFVs-gguHyYgsuXHQ', // เปลี่ยนเป็น ID ของคุณ
    BASE_URL: 'https://opensheet.elk.sh',
    APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycby78K_kXW1YhVKO4EQMUuXo8D78d2mQuT6fphBAsxmoL_T86WkhZdILmhHkgw-BD-ac/exec', // ใส่ URL ของ Google Apps Script Web App
    SHEETS: {
        WORDS: 'คำ',
        WORDSETS: 'ชุดคำ',
        TEACHERS: 'teachers',
        CLASSROOMS: 'classrooms',
        STUDENTS: 'students',
        STUDENT_PROGRESS: 'student_progress',
        GAME_LOGS: 'game_logs',
        SYSTEM_SETTINGS: 'system_settings',
        LOG: 'log'
    }
};

// ระบบการจัดการ Loading
class LoadingManager {
    static show(element) {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        if (element) {
            element.style.display = 'flex';
        }
    }

    static hide(element) {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        if (element) {
            element.style.display = 'none';
        }
    }
}

// ระบบการจัดการ Session
class SessionManager {
    static setSession(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }

    static getSession(key) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return null;
        }
    }

    static removeSession(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Error removing from localStorage:', error);
        }
    }

    static getCurrentTeacher() {
        return this.getSession('currentTeacher');
    }

    static setCurrentTeacher(teacher) {
        this.setSession('currentTeacher', teacher);
    }

    static logout() {
        this.removeSession('currentTeacher');
        window.location.href = 'teacher-login.html';
    }
}

// ระบบการเชื่อมต่อ Google Sheets
class SheetsAPI {
    /**
     * อ่านข้อมูลจาก Google Sheets
     */
    static async fetchData(sheetName) {
        try {
            const url = `${CONFIG.BASE_URL}/${CONFIG.SPREADSHEET_ID}/${encodeURIComponent(sheetName)}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error(`Error fetching data from ${sheetName}:`, error);
            throw error;
        }
    }

    /**
     * ส่งข้อมูลไปยัง Google Apps Script
     */
    static async postData(action, data) {
        try {
            if (!CONFIG.APPS_SCRIPT_URL) {
                throw new Error('Apps Script URL not configured');
            }

            const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: action,
                    data: data,
                    timestamp: new Date().toISOString()
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error posting data:', error);
            throw error;
        }
    }
}

// ระบบการจัดการคำศัพท์
class WordsManager {
    /**
     * ดึงข้อมูลคำศัพท์ทั้งหมด
     */
    static async getAllWords() {
        try {
            const words = await SheetsAPI.fetchData(CONFIG.SHEETS.WORDS);
            return words.map(word => ({
                id: word.ID || '',
                wordsetId: word['ID ชุดคำ'] || '',
                word: word['คำ'] || '',
                highlightChars: word['ตัวอักษรที่ต้องการให้สีต่างจากพวก'] || '',
                imageUrl: word['ลิงก์รูปภาพ'] || '',
                englishWord: word['คำภาษาอังกฤษ'] || '',
                englishHint: word['คำใบ้ภาษาอังกฤษ'] || '',
                createdDate: word['วันที่สร้าง'] || new Date().toISOString()
            }));
        } catch (error) {
            console.error('Error fetching words:', error);
            throw error;
        }
    }

    /**
     * ดึงข้อมูลชุดคำทั้งหมด
     */
    static async getAllWordsets() {
        try {
            const wordsets = await SheetsAPI.fetchData(CONFIG.SHEETS.WORDSETS);
            return wordsets.map(wordset => ({
                id: wordset['ID ชุดคำ'] || '',
                name: wordset['ชื่อชุดคำ'] || '',
                wordCount: parseInt(wordset['จำนวนคำ']) || 0,
                correctPercentage: parseFloat(wordset['ร้อยละการตอบถูก']) || 0
            }));
        } catch (error) {
            console.error('Error fetching wordsets:', error);
            throw error;
        }
    }

    /**
     * เพิ่มคำศัพท์ใหม่
     */
    static async addWord(wordData) {
        try {
            return await SheetsAPI.postData('addWord', {
                wordsetId: wordData.wordsetId,
                word: wordData.word,
                highlightChars: wordData.highlightChars || '',
                imageUrl: wordData.imageUrl || '',
                englishWord: wordData.englishWord || '',
                englishHint: wordData.englishHint || '',
                createdBy: SessionManager.getCurrentTeacher()?.id || 'unknown'
            });
        } catch (error) {
            console.error('Error adding word:', error);
            throw error;
        }
    }

    /**
     * แก้ไขคำศัพท์
     */
    static async updateWord(wordId, wordData) {
        try {
            return await SheetsAPI.postData('updateWord', {
                id: wordId,
                wordsetId: wordData.wordsetId,
                word: wordData.word,
                highlightChars: wordData.highlightChars || '',
                imageUrl: wordData.imageUrl || '',
                englishWord: wordData.englishWord || '',
                englishHint: wordData.englishHint || '',
                updatedBy: SessionManager.getCurrentTeacher()?.id || 'unknown'
            });
        } catch (error) {
            console.error('Error updating word:', error);
            throw error;
        }
    }

    /**
     * ลบคำศัพท์
     */
    static async deleteWord(wordId) {
        try {
            return await SheetsAPI.postData('deleteWord', {
                id: wordId,
                deletedBy: SessionManager.getCurrentTeacher()?.id || 'unknown'
            });
        } catch (error) {
            console.error('Error deleting word:', error);
            throw error;
        }
    }

    /**
     * ลบคำศัพท์หลายคำ
     */
    static async deleteMultipleWords(wordIds) {
        try {
            return await SheetsAPI.postData('deleteMultipleWords', {
                ids: wordIds,
                deletedBy: SessionManager.getCurrentTeacher()?.id || 'unknown'
            });
        } catch (error) {
            console.error('Error deleting multiple words:', error);
            throw error;
        }
    }

    /**
     * นำเข้าคำศัพท์จาก Excel
     */
    static async importWords(wordsArray) {
        try {
            return await SheetsAPI.postData('importWords', {
                words: wordsArray,
                importedBy: SessionManager.getCurrentTeacher()?.id || 'unknown'
            });
        } catch (error) {
            console.error('Error importing words:', error);
            throw error;
        }
    }
}

// ฟังก์ชันยูทิลิตี้
class Utils {
    /**
     * จัดรูปแบบวันที่
     */
    static formatDate(dateString) {
        if (!dateString) return '-';
        
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '-';
            
            return date.toLocaleDateString('th-TH', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return '-';
        }
    }

    /**
     * สร้าง ID ใหม่
     */
    static generateId(prefix = '') {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        return `${prefix}${timestamp}${random}`.toUpperCase();
    }

    /**
     * ตรวจสอบ URL รูปภาพ
     */
    static isValidImageUrl(url) {
        if (!url) return false;
        
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
        const extension = url.split('.').pop().toLowerCase();
        
        return imageExtensions.includes(extension) || 
               url.includes('drive.google.com') || 
               url.includes('imgur.com') ||
               url.includes('cloudinary.com');
    }

    /**
     * ดีเบาซ์สำหรับค้นหา
     */
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * แสดงข้อความแจ้งเตือน
     */
    static showAlert(title, text, icon = 'info') {
        return Swal.fire({
            title: title,
            text: text,
            icon: icon,
            confirmButtonText: 'ตกลง',
            confirmButtonColor: '#667eea'
        });
    }

    /**
     * แสดงข้อความยืนยัน
     */
    static showConfirm(title, text, confirmText = 'ยืนยัน', cancelText = 'ยกเลิก') {
        return Swal.fire({
            title: title,
            text: text,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: confirmText,
            cancelButtonText: cancelText,
            confirmButtonColor: '#667eea',
            cancelButtonColor: '#6c757d'
        });
    }

    /**
     * แสดงข้อความสำเร็จ
     */
    static showSuccess(title, text = '') {
        return Swal.fire({
            title: title,
            text: text,
            icon: 'success',
            confirmButtonText: 'ตกลง',
            confirmButtonColor: '#28a745'
        });
    }

    /**
     * แสดงข้อความข้อผิดพลาด
     */
    static showError(title, text = '') {
        return Swal.fire({
            title: title,
            text: text,
            icon: 'error',
            confirmButtonText: 'ตกลง',
            confirmButtonColor: '#dc3545'
        });
    }

    /**
     * แสดง Loading Toast
     */
    static showLoading(title = 'กำลังโหลด...') {
        return Swal.fire({
            title: title,
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
    }
}

// ระบบการจัดการไฟล์
class FileManager {
    /**
     * อ่านไฟล์ Excel
     */
    static readExcelFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    // ต้องใช้ library เช่น xlsx.js สำหรับอ่าน Excel
                    // ตัวอย่างนี้เป็นโครงสร้างพื้นฐาน
                    const data = e.target.result;
                    
                    // TODO: Implement Excel parsing
                    // const workbook = XLSX.read(data, { type: 'binary' });
                    // const sheetName = workbook.SheetNames[0];
                    // const worksheet = workbook.Sheets[sheetName];
                    // const jsonData = XLSX.utils.sheet_to_json(worksheet);
                    
                    resolve([]);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = function() {
                reject(new Error('ไม่สามารถอ่านไฟล์ได้'));
            };
            
            reader.readAsBinaryString(file);
        });
    }

    /**
     * อัปโหลดรูปภาพ
     */
    static async uploadImage(file) {
        // ตัวอย่างการอัปโหลดรูปภาพ
        // ในการใช้งานจริงต้องมีระบบอัปโหลดรูปภาพ
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                // ส่งกลับ data URL สำหรับแสดงผล
                // ในการใช้งานจริงควรอัปโหลดไปยัง cloud storage
                resolve(e.target.result);
            };
            
            reader.onerror = function() {
                reject(new Error('ไม่สามารถอัปโหลดรูปภาพได้'));
            };
            
            reader.readAsDataURL(file);
        });
    }
}

// ระบบการจัดการ Sidebar
class SidebarManager {
    static init() {
        const menuToggle = document.getElementById('menuToggle');
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.querySelector('.main-content');

        if (menuToggle && sidebar && mainContent) {
            menuToggle.addEventListener('click', () => {
                sidebar.classList.toggle('collapsed');
                mainContent.classList.toggle('expanded');
            });
        }

        // ปิด sidebar เมื่อคลิกข้างนอกในมือถือ
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                    sidebar.classList.add('collapsed');
                    mainContent.classList.add('expanded');
                }
            }
        });
    }
}

// ตรวจสอบสิทธิ์การเข้าถึง
function checkAuthentication() {
    const currentTeacher = SessionManager.getCurrentTeacher();
    
    if (!currentTeacher) {
        window.location.href = 'teacher-login.html';
        return false;
    }
    
    // อัปเดตข้อมูลครูใน header
    const teacherName = document.getElementById('teacherName');
    const teacherAvatar = document.getElementById('teacherAvatar');
    
    if (teacherName) {
        teacherName.textContent = currentTeacher.name || 'ครู';
    }
    
    if (teacherAvatar && currentTeacher.avatar) {
        teacherAvatar.src = currentTeacher.avatar;
    }
    
    return true;
}

// Event Listeners สำหรับการใช้งานทั่วไป
document.addEventListener('DOMContentLoaded', function() {
    // ตรวจสอบสิทธิ์
    if (!checkAuthentication()) return;
    
    // เริ่มต้น Sidebar
    SidebarManager.init();
    
    // ปุ่มออกจากระบบ
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            const result = await Utils.showConfirm(
                'ออกจากระบบ',
                'คุณต้องการออกจากระบบหรือไม่?'
            );
            
            if (result.isConfirmed) {
                SessionManager.logout();
            }
        });
    }
    
    // ป้องกันการคลิกขวา (ตัวเลือก)
    document.addEventListener('contextmenu', function(e) {
        // e.preventDefault(); // เปิด comment หากต้องการป้องกัน
    });
});

// Export สำหรับการใช้งานในไฟล์อื่น
window.CONFIG = CONFIG;
window.LoadingManager = LoadingManager;
window.SessionManager = SessionManager;
window.SheetsAPI = SheetsAPI;
window.WordsManager = WordsManager;
window.Utils = Utils;
window.FileManager = FileManager;