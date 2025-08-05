/**
 * JavaScript สำหรับหน้าจัดการคำศัพท์
 */

// ตัวแปรสำหรับเก็บข้อมูล
let allWords = [];
let allWordsets = [];
let filteredWords = [];
let currentPage = 1;
let itemsPerPage = 10;
let sortColumn = 'id';
let sortDirection = 'asc';
let selectedWords = [];

// Elements
let wordsTable, wordsTableBody, searchInput, wordsetFilter;
let wordModal, wordForm, modalTitle;
let importModal, excelFile, importPreview;
let loadingElement, emptyState, pagination;

// Stats elements
let totalWordsElement, totalWordsetsElement, wordsWithImagesElement, wordsWithHintsElement;

/**
 * เริ่มต้นระบบ
 */
document.addEventListener('DOMContentLoaded', function() {
    initializeElements();
    initializeEventListeners();
    loadInitialData();
});

/**
 * กำหนด Elements
 */
function initializeElements() {
    // Table elements
    wordsTable = document.getElementById('wordsTable');
    wordsTableBody = document.getElementById('wordsTableBody');
    searchInput = document.getElementById('searchInput');
    wordsetFilter = document.getElementById('wordsetFilter');
    
    // Modal elements
    wordModal = document.getElementById('wordModal');
    wordForm = document.getElementById('wordForm');
    modalTitle = document.getElementById('modalTitle');
    
    // Import modal elements
    importModal = document.getElementById('importModal');
    excelFile = document.getElementById('excelFile');
    importPreview = document.getElementById('importPreview');
    
    // Loading and empty state
    loadingElement = document.getElementById('loading');
    emptyState = document.getElementById('emptyState');
    pagination = document.getElementById('pagination');
    
    // Stats elements
    totalWordsElement = document.getElementById('totalWords');
    totalWordsetsElement = document.getElementById('totalWordsets');
    wordsWithImagesElement = document.getElementById('wordsWithImages');
    wordsWithHintsElement = document.getElementById('wordsWithHints');
}

/**
 * กำหนด Event Listeners
 */
function initializeEventListeners() {
    // Search functionality
    if (searchInput) {
        searchInput.addEventListener('input', Utils.debounce(() => {
            filterWords();
        }, 300));
    }
    
    // Filter functionality
    if (wordsetFilter) {
        wordsetFilter.addEventListener('change', filterWords);
    }
    
    // Add word button
    const addWordBtn = document.getElementById('addWordBtn');
    if (addWordBtn) {
        addWordBtn.addEventListener('click', openAddWordModal);
    }
    
    // Import button
    const importBtn = document.getElementById('importBtn');
    if (importBtn) {
        importBtn.addEventListener('click', openImportModal);
    }
    
    // Export button
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportWords);
    }
    
    // Select all functionality
    const selectAllBtn = document.getElementById('selectAllBtn');
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    
    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', toggleSelectAll);
    }
    
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', toggleSelectAll);
    }
    
    // Delete selected button
    const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
    if (deleteSelectedBtn) {
        deleteSelectedBtn.addEventListener('click', deleteSelectedWords);
    }
    
    // Modal events
    const closeModal = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelBtn');
    
    if (closeModal) {
        closeModal.addEventListener('click', closeWordModal);
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeWordModal);
    }
    
    // Form submission
    if (wordForm) {
        wordForm.addEventListener('submit', handleWordSubmit);
    }
    
    // Image upload events
    const imageFile = document.getElementById('imageFile');
    const imageUrl = document.getElementById('imageUrl');
    const imageUploadArea = document.getElementById('imageUploadArea');
    const removeImage = document.getElementById('removeImage');
    
    if (imageFile) {
        imageFile.addEventListener('change', handleImageFileSelect);
    }
    
    if (imageUrl) {
        imageUrl.addEventListener('input', handleImageUrlChange);
    }
    
    if (imageUploadArea) {
        imageUploadArea.addEventListener('dragover', handleDragOver);
        imageUploadArea.addEventListener('drop', handleImageDrop);
    }
    
    if (removeImage) {
        removeImage.addEventListener('click', clearImagePreview);
    }
    
    // Excel file input
    if (excelFile) {
        excelFile.addEventListener('change', handleExcelFileSelect);
    }
    
    // Pagination
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => changePage(currentPage - 1));
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => changePage(currentPage + 1));
    }
    
    // Table sorting
    const sortableHeaders = document.querySelectorAll('.sortable');
    sortableHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const column = header.dataset.sort;
            handleSort(column);
        });
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === wordModal) {
            closeWordModal();
        }
        if (e.target === importModal) {
            closeImportModal();
        }
    });
}

/**
 * โหลดข้อมูลเริ่มต้น
 */
async function loadInitialData() {
    try {
        LoadingManager.show(loadingElement);
        
        // โหลดข้อมูลพร้อมกัน
        const [words, wordsets] = await Promise.all([
            WordsManager.getAllWords(),
            WordsManager.getAllWordsets()
        ]);
        
        allWords = words;
        allWordsets = wordsets;
        
        // อัปเดต UI
        updateWordsetFilter();
        updateStats();
        filterWords();
        
    } catch (error) {
        console.error('Error loading initial data:', error);
        Utils.showError('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
        LoadingManager.hide(loadingElement);
    }
}

/**
 * อัปเดต Wordset Filter
 */
function updateWordsetFilter() {
    if (!wordsetFilter) return;
    
    // ล้างตัวเลือกเดิม
    wordsetFilter.innerHTML = '<option value="">ทุกชุดคำ</option>';
    
    // เพิ่มตัวเลือกใหม่
    allWordsets.forEach(wordset => {
        const option = document.createElement('option');
        option.value = wordset.id;
        option.textContent = wordset.name;
        wordsetFilter.appendChild(option);
    });
    
    // อัปเดต wordset select ใน modal
    const wordsetSelect = document.getElementById('wordsetSelect');
    if (wordsetSelect) {
        wordsetSelect.innerHTML = '<option value="">เลือกชุดคำ</option>';
        allWordsets.forEach(wordset => {
            const option = document.createElement('option');
            option.value = wordset.id;
            option.textContent = wordset.name;
            wordsetSelect.appendChild(option);
        });
    }
}

/**
 * อัปเดตสถิติ
 */
function updateStats() {
    if (totalWordsElement) {
        totalWordsElement.textContent = allWords.length.toLocaleString();
    }
    
    if (totalWordsetsElement) {
        totalWordsetsElement.textContent = allWordsets.length.toLocaleString();
    }
    
    if (wordsWithImagesElement) {
        const wordsWithImages = allWords.filter(word => word.imageUrl && word.imageUrl.trim() !== '');
        wordsWithImagesElement.textContent = wordsWithImages.length.toLocaleString();
    }
    
    if (wordsWithHintsElement) {
        const wordsWithHints = allWords.filter(word => 
            (word.englishHint && word.englishHint.trim() !== '') || 
            (word.highlightChars && word.highlightChars.trim() !== '')
        );
        wordsWithHintsElement.textContent = wordsWithHints.length.toLocaleString();
    }
}

/**
 * กรองคำศัพท์
 */
function filterWords() {
    let filtered = [...allWords];
    
    // กรองตามคำค้นหา
    const searchTerm = searchInput?.value.toLowerCase().trim() || '';
    if (searchTerm) {
        filtered = filtered.filter(word => 
            word.word.toLowerCase().includes(searchTerm) ||
            word.englishWord.toLowerCase().includes(searchTerm) ||
            word.englishHint.toLowerCase().includes(searchTerm)
        );
    }
    
    // กรองตามชุดคำ
    const selectedWordset = wordsetFilter?.value || '';
    if (selectedWordset) {
        filtered = filtered.filter(word => word.wordsetId === selectedWordset);
    }
    
    // เรียงลำดับ
    filtered.sort((a, b) => {
        let aValue = a[sortColumn] || '';
        let bValue = b[sortColumn] || '';
        
        // แปลงเป็นตัวเลขหากเป็นตัวเลข
        if (!isNaN(aValue) && !isNaN(bValue)) {
            aValue = parseFloat(aValue);
            bValue = parseFloat(bValue);
        }
        
        if (sortDirection === 'asc') {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });
    
    filteredWords = filtered;
    currentPage = 1;
    renderTable();
    updatePagination();
}

/**
 * จัดการการเรียงลำดับ
 */
function handleSort(column) {
    if (sortColumn === column) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        sortColumn = column;
        sortDirection = 'asc';
    }
    
    // อัปเดตไอคอนการเรียงลำดับ
    document.querySelectorAll('.sortable i').forEach(icon => {
        icon.className = 'fas fa-sort';
    });
    
    const currentHeader = document.querySelector(`[data-sort="${column}"] i`);
    if (currentHeader) {
        currentHeader.className = sortDirection === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
    }
    
    filterWords();
}

/**
 * แสดงผลตาราง
 */
function renderTable() {
    if (!wordsTableBody) return;
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentWords = filteredWords.slice(startIndex, endIndex);
    
    if (currentWords.length === 0) {
        wordsTableBody.innerHTML = '';
        if (emptyState) {
            emptyState.style.display = filteredWords.length === 0 ? 'block' : 'none';
        }
        return;
    }
    
    if (emptyState) {
        emptyState.style.display = 'none';
    }
    
    wordsTableBody.innerHTML = currentWords.map(word => {
        const wordset = allWordsets.find(ws => ws.id === word.wordsetId);
        const isSelected = selectedWords.includes(word.id);
        
        return `
            <tr class="${isSelected ? 'selected' : ''}">
                <td class="checkbox-col">
                    <input type="checkbox" 
                           value="${word.id}" 
                           ${isSelected ? 'checked' : ''}
                           onchange="toggleWordSelection('${word.id}')">
                </td>
                <td>${word.id || '-'}</td>
                <td>
                    <strong>${word.word || '-'}</strong>
                    ${word.highlightChars ? `<br><small class="text-muted">ไฮไลต์: ${word.highlightChars}</small>` : ''}
                </td>
                <td>${wordset ? wordset.name : '-'}</td>
                <td>
                    ${word.imageUrl ? 
                        `<img src="${word.imageUrl}" 
                             alt="${word.word}" 
                             class="word-image" 
                             onclick="showImagePreview('${word.imageUrl}', '${word.word}')"
                             onerror="this.style.display='none'">` 
                        : '-'
                    }
                </td>
                <td>${word.englishWord || '-'}</td>
                <td>${word.englishHint || '-'}</td>
                <td>${Utils.formatDate(word.createdDate)}</td>
                <td class="actions-col">
                    <button class="action-btn edit" 
                            onclick="editWord('${word.id}')" 
                            title="แก้ไข">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" 
                            onclick="deleteWord('${word.id}')" 
                            title="ลบ">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * อัปเดต Pagination
 */
function updatePagination() {
    if (!pagination) return;
    
    const totalPages = Math.ceil(filteredWords.length / itemsPerPage);
    
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const pageInfo = document.getElementById('pageInfo');
    
    if (prevBtn) {
        prevBtn.disabled = currentPage <= 1;
    }
    
    if (nextBtn) {
        nextBtn.disabled = currentPage >= totalPages;
    }
    
    if (pageInfo) {
        pageInfo.textContent = `หน้า ${currentPage} จาก ${totalPages}`;
    }
}

/**
 * เปลี่ยนหน้า
 */
function changePage(page) {
    const totalPages = Math.ceil(filteredWords.length / itemsPerPage);
    
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    renderTable();
    updatePagination();
}

/**
 * เปิด Modal เพิ่มคำศัพท์
 */
function openAddWordModal() {
    if (modalTitle) {
        modalTitle.textContent = 'เพิ่มคำศัพท์ใหม่';
    }
    
    if (wordForm) {
        wordForm.reset();
        document.getElementById('wordId').value = '';
    }
    
    clearImagePreview();
    
    if (wordModal) {
        wordModal.classList.add('active');
    }
}

/**
 * แก้ไขคำศัพท์
 */
function editWord(wordId) {
    const word = allWords.find(w => w.id === wordId);
    if (!word) return;
    
    if (modalTitle) {
        modalTitle.textContent = 'แก้ไขคำศัพท์';
    }
    
    // กรอกข้อมูลในฟอร์ม
    document.getElementById('wordId').value = word.id;
    document.getElementById('wordText').value = word.word;
    document.getElementById('wordsetSelect').value = word.wordsetId;
    document.getElementById('englishWord').value = word.englishWord || '';
    document.getElementById('englishHint').value = word.englishHint || '';
    document.getElementById('highlightChars').value = word.highlightChars || '';
    document.getElementById('imageUrl').value = word.imageUrl || '';
    
    // แสดงภาพตัวอย่าง
    if (word.imageUrl) {
        showImagePreview(word.imageUrl);
    }
    
    if (wordModal) {
        wordModal.classList.add('active');
    }
}

/**
 * ปิด Modal
 */
function closeWordModal() {
    if (wordModal) {
        wordModal.classList.remove('active');
    }
}

/**
 * จัดการการส่งฟอร์ม
 */
async function handleWordSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(wordForm);
    const wordData = {
        wordsetId: formData.get('wordsetId'),
        word: formData.get('word'),
        englishWord: formData.get('englishWord') || '',
        englishHint: formData.get('englishHint') || '',
        highlightChars: formData.get('highlightChars') || '',
        imageUrl: formData.get('imageUrl') || ''
    };
    
    // ตรวจสอบข้อมูล
    if (!wordData.word.trim()) {
        Utils.showError('ข้อมูลไม่ครบ', 'กรุณากรอกคำศัพท์');
        return;
    }
    
    if (!wordData.wordsetId) {
        Utils.showError('ข้อมูลไม่ครบ', 'กรุณาเลือกชุดคำ');
        return;
    }
    
    try {
        Utils.showLoading('กำลังบันทึกข้อมูล...');
        
        const wordId = formData.get('id');
        
        if (wordId) {
            // แก้ไขคำศัพท์
            await WordsManager.updateWord(wordId, wordData);
            Utils.showSuccess('สำเร็จ', 'แก้ไขคำศัพท์เรียบร้อยแล้ว');
        } else {
            // เพิ่มคำศัพท์ใหม่
            await WordsManager.addWord(wordData);
            Utils.showSuccess('สำเร็จ', 'เพิ่มคำศัพท์เรียบร้อยแล้ว');
        }
        
        closeWordModal();
        await loadInitialData(); // โหลดข้อมูลใหม่
        
    } catch (error) {
        console.error('Error saving word:', error);
        Utils.showError('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
    }
}

/**
 * ลบคำศัพท์
 */
async function deleteWord(wordId) {
    const word = allWords.find(w => w.id === wordId);
    if (!word) return;
    
    const result = await Utils.showConfirm(
        'ยืนยันการลบ',
        `คุณต้องการลบคำศัพท์ "${word.word}" หรือไม่?`,
        'ลบ',
        'ยกเลิก'
    );
    
    if (!result.isConfirmed) return;
    
    try {
        Utils.showLoading('กำลังลบข้อมูล...');
        
        await WordsManager.deleteWord(wordId);
        
        Utils.showSuccess('สำเร็จ', 'ลบคำศัพท์เรียบร้อยแล้ว');
        await loadInitialData(); // โหลดข้อมูลใหม่
        
    } catch (error) {
        console.error('Error deleting word:', error);
        Utils.showError('เกิดข้อผิดพลาด', 'ไม่สามารถลบข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
    }
}

/**
 * จัดการการเลือกคำศัพท์
 */
function toggleWordSelection(wordId) {
    const index = selectedWords.indexOf(wordId);
    
    if (index > -1) {
        selectedWords.splice(index, 1);
    } else {
        selectedWords.push(wordId);
    }
    
    updateSelectionUI();
}

/**
 * เลือก/ยกเลิกเลือกทั้งหมด
 */
function toggleSelectAll() {
    const currentWords = getCurrentPageWords();
    const allSelected = currentWords.every(word => selectedWords.includes(word.id));
    
    if (allSelected) {
        // ยกเลิกเลือกทั้งหมด
        currentWords.forEach(word => {
            const index = selectedWords.indexOf(word.id);
            if (index > -1) {
                selectedWords.splice(index, 1);
            }
        });
    } else {
        // เลือกทั้งหมด
        currentWords.forEach(word => {
            if (!selectedWords.includes(word.id)) {
                selectedWords.push(word.id);
            }
        });
    }
    
    updateSelectionUI();
    renderTable();
}

/**
 * ได้รับคำศัพท์ในหน้าปัจจุบัน
 */
function getCurrentPageWords() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredWords.slice(startIndex, endIndex);
}

/**
 * อัปเดต UI การเลือก
 */
function updateSelectionUI() {
    const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    
    if (deleteSelectedBtn) {
        deleteSelectedBtn.disabled = selectedWords.length === 0;
    }
    
    if (selectAllCheckbox) {
        const currentWords = getCurrentPageWords();
        const allSelected = currentWords.length > 0 && currentWords.every(word => selectedWords.includes(word.id));
        selectAllCheckbox.checked = allSelected;
    }
}

/**
 * ลบคำศัพท์ที่เลือก
 */
async function deleteSelectedWords() {
    if (selectedWords.length === 0) return;
    
    const result = await Utils.showConfirm(
        'ยืนยันการลบ',
        `คุณต้องการลบคำศัพท์ ${selectedWords.length} คำ หรือไม่?`,
        'ลบทั้งหมด',
        'ยกเลิก'
    );
    
    if (!result.isConfirmed) return;
    
    try {
        Utils.showLoading('กำลังลบข้อมูล...');
        
        await WordsManager.deleteMultipleWords(selectedWords);
        
        selectedWords = [];
        Utils.showSuccess('สำเร็จ', 'ลบคำศัพท์เรียบร้อยแล้ว');
        await loadInitialData(); // โหลดข้อมูลใหม่
        
    } catch (error) {
        console.error('Error deleting multiple words:', error);
        Utils.showError('เกิดข้อผิดพลาด', 'ไม่สามารถลบข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
    }
}

// ฟังก์ชันสำหรับการจัดการรูปภาพ
function handleImageFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        Utils.showError('ไฟล์ไม่ถูกต้อง', 'กรุณาเลือกไฟล์รูปภาพ');
        return;
    }
    
    uploadImageFile(file);
}

function handleImageUrlChange(e) {
    const url = e.target.value.trim();
    if (url) {
        showImagePreview(url);
    } else {
        clearImagePreview();
    }
}

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
}

function handleImageDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('image/')) {
            uploadImageFile(file);
        } else {
            Utils.showError('ไฟล์ไม่ถูกต้อง', 'กรุณาเลือกไฟล์รูปภาพ');
        }
    }
}

async function uploadImageFile(file) {
    try {
        Utils.showLoading('กำลังอัปโหลดรูปภาพ...');
        
        const imageUrl = await FileManager.uploadImage(file);
        document.getElementById('imageUrl').value = imageUrl;
        showImagePreview(imageUrl);
        
        Swal.close();
        
    } catch (error) {
        console.error('Error uploading image:', error);
        Utils.showError('เกิดข้อผิดพลาด', 'ไม่สามารถอัปโหลดรูปภาพได้ กรุณาลองใหม่อีกครั้ง');
    }
}

function showImagePreview(url, alt = '') {
    const imagePreview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    
    if (imagePreview && previewImg) {
        previewImg.src = url;
        previewImg.alt = alt;
        imagePreview.style.display = 'block';
    }
}

function clearImagePreview() {
    const imagePreview = document.getElementById('imagePreview');
    const imageUrl = document.getElementById('imageUrl');
    const imageFile = document.getElementById('imageFile');
    
    if (imagePreview) {
        imagePreview.style.display = 'none';
    }
    
    if (imageUrl) {
        imageUrl.value = '';
    }
    
    if (imageFile) {
        imageFile.value = '';
    }
}

// ฟังก์ชันสำหรับ Import/Export
function openImportModal() {
    if (importModal) {
        importModal.classList.add('active');
    }
}

function closeImportModal() {
    if (importModal) {
        importModal.classList.remove('active');
    }
    
    // ล้างข้อมูล
    if (excelFile) {
        excelFile.value = '';
    }
    
    if (importPreview) {
        importPreview.style.display = 'none';
    }
    
    const confirmImportBtn = document.getElementById('confirmImportBtn');
    if (confirmImportBtn) {
        confirmImportBtn.disabled = true;
    }
}

async function handleExcelFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
        Utils.showLoading('กำลังอ่านไฟล์...');
        
        const data = await FileManager.readExcelFile(file);
        
        // แสดงตัวอย่างข้อมูล
        displayImportPreview(data);
        
        const confirmImportBtn = document.getElementById('confirmImportBtn');
        if (confirmImportBtn) {
            confirmImportBtn.disabled = false;
        }
        
        Swal.close();
        
    } catch (error) {
        console.error('Error reading Excel file:', error);
        Utils.showError('เกิดข้อผิดพลาด', 'ไม่สามารถอ่านไฟล์ Excel ได้ กรุณาตรวจสอบรูปแบบไฟล์');
    }
}

function displayImportPreview(data) {
    if (!importPreview || !data || data.length === 0) return;
    
    const previewTable = importPreview.querySelector('.preview-table');
    if (!previewTable) return;
    
    // สร้างตารางตัวอย่าง
    const table = document.createElement('table');
    table.className = 'table table-sm';
    
    // Header
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>คำศัพท์</th>
            <th>ID ชุดคำ</th>
            <th>ตัวอักษรไฮไลต์</th>
            <th>ลิงก์รูปภาพ</th>
            <th>คำภาษาอังกฤษ</th>
            <th>คำใบ้ภาษาอังกฤษ</th>
        </tr>
    `;
    table.appendChild(thead);
    
    // Body (แสดง 5 แถวแรก)
    const tbody = document.createElement('tbody');
    const previewData = data.slice(0, 5);
    
    previewData.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row[0] || '-'}</td>
            <td>${row[1] || '-'}</td>
            <td>${row[2] || '-'}</td>
            <td>${row[3] ? `<small>${row[3].substring(0, 30)}...</small>` : '-'}</td>
            <td>${row[4] || '-'}</td>
            <td>${row[5] || '-'}</td>
        `;
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    
    previewTable.innerHTML = '';
    previewTable.appendChild(table);
    
    importPreview.style.display = 'block';
}

async function confirmImport() {
    // TODO: Implement import confirmation
    Utils.showError('ยังไม่พร้อมใช้งาน', 'ฟีเจอร์นำเข้าข้อมูลยังอยู่ในระหว่างการพัฒนา');
}

async function exportWords() {
    try {
        Utils.showLoading('กำลังส่งออกข้อมูล...');
        
        // สร้างข้อมูล CSV
        const csvData = [
            ['ID', 'คำศัพท์', 'ID ชุดคำ', 'ชื่อชุดคำ', 'ตัวอักษรไฮไลต์', 'ลิงก์รูปภาพ', 'คำภาษาอังกฤษ', 'คำใบ้ภาษาอังกฤษ', 'วันที่สร้าง']
        ];
        
        filteredWords.forEach(word => {
            const wordset = allWordsets.find(ws => ws.id === word.wordsetId);
            csvData.push([
                word.id,
                word.word,
                word.wordsetId,
                wordset ? wordset.name : '',
                word.highlightChars,
                word.imageUrl,
                word.englishWord,
                word.englishHint,
                Utils.formatDate(word.createdDate)
            ]);
        });
        
        // สร้างไฟล์ CSV
        const csvContent = csvData.map(row => 
            row.map(cell => `"${cell || ''}"`).join(',')
        ).join('\n');
        
        // ดาวน์โหลดไฟล์
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `words_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        Swal.close();
        Utils.showSuccess('สำเร็จ', 'ส่งออกข้อมูลเรียบร้อยแล้ว');
        
    } catch (error) {
        console.error('Error exporting words:', error);
        Utils.showError('เกิดข้อผิดพลาด', 'ไม่สามารถส่งออกข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
    }
}

// ฟังก์ชันแสดงรูปภาพแบบขยาย
function showImagePreviewModal(imageUrl, alt = '') {
    if (!imageUrl) return;
    
    Swal.fire({
        title: alt || 'รูปภาพ',
        html: `<img src="${imageUrl}" alt="${alt}" style="max-width: 100%; max-height: 400px; object-fit: contain;">`,
        width: 'auto',
        showCloseButton: true,
        showConfirmButton: false,
        customClass: {
            popup: 'image-preview-modal'
        }
    });
}

// Event listener สำหรับปุ่ม Confirm Import
document.addEventListener('DOMContentLoaded', function() {
    const confirmImportBtn = document.getElementById('confirmImportBtn');
    if (confirmImportBtn) {
        confirmImportBtn.addEventListener('click', confirmImport);
    }
});

// Global functions สำหรับใช้ใน HTML
window.openAddWordModal = openAddWordModal;
window.editWord = editWord;
window.deleteWord = deleteWord;
window.toggleWordSelection = toggleWordSelection;
window.showImagePreview = showImagePreviewModal;