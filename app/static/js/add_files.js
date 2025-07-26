let selectedFiles = [];
const maxSize = 200 * 1024 * 1024; // 200MB in bytes ['txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'doc', 'docx', 'xls', 'xlsx', 'zip', 'rar', 'csv', 'mp4', 'mp3', 'avi'];
const allowedExtensions = ['txt', 'pdf', 'doc', 'docx', 'xls', 'csv'];

// Database card selection
document.querySelectorAll('.database-card').forEach(card => {
    card.addEventListener('click', function() {
        if (this.dataset.type !== 'filestack') {
            document.querySelectorAll('.database-card').forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
        }
    });
});

function openFileUploadModal() {
    document.getElementById('fileUploadModal').style.display = 'block';
}

function closeFileUploadModal() {
    document.getElementById('fileUploadModal').style.display = 'none';
    resetForm();
}

function resetForm() {
    document.getElementById('fileUploadForm').reset();
    selectedFiles = [];
    updateFileList();
    document.getElementById('progressContainer').style.display = 'none';
    document.getElementById('progressFill').style.width = '0%';
    document.getElementById('progressText').textContent = '0%';
    clearValidationMessages();
}

// File validation functions
function isAllowedExtension(filename) {
    const extension = filename.split('.').pop().toLowerCase();
    return allowedExtensions.includes(extension);
}

function validateFileSize(file) {
    return file.size <= maxSize;
}

function validateTotalSize(files) {
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    return totalSize <= maxSize;
}

function displayValidationError(message) {
    let errorDiv = document.getElementById('validationError');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'validationError';
        errorDiv.style.cssText = `
            color: #dc3545;
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
            border-radius: 4px;
            padding: 10px;
            margin: 10px 0;
            font-size: 14px;
        `;
        document.getElementById('fileList').parentNode.insertBefore(errorDiv, document.getElementById('fileList'));
    }
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

function clearValidationMessages() {
    const errorDiv = document.getElementById('validationError');
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
}

// File upload area events
const fileUploadArea = document.getElementById('fileUploadArea');
const fileInput = document.getElementById('fileInput');

fileUploadArea.addEventListener('click', () => fileInput.click());

fileUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileUploadArea.classList.add('dragover');
});

fileUploadArea.addEventListener('dragleave', () => {
    fileUploadArea.classList.remove('dragover');
});

fileUploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    fileUploadArea.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

function handleFiles(files) {
    clearValidationMessages();
    let hasErrors = false;
    let errorMessages = [];
    
    for (let file of files) {
        // Check if file already exists
        if (selectedFiles.find(f => f.name === file.name)) {
            continue; // Skip duplicate files
        }
        
        // Validate file extension
        if (!isAllowedExtension(file.name)) {
            errorMessages.push(`❌ "${file.name}": File type not allowed`);
            hasErrors = true;
            continue;
        }
        
        // Validate individual file size
        if (!validateFileSize(file)) {
            errorMessages.push(`❌ "${file.name}": File too large (${formatFileSize(file.size)}). Max size per file: ${formatFileSize(maxSize)}`);
            hasErrors = true;
            continue;
        }
        
        // Add valid files
        selectedFiles.push(file);
    }
    
    // Validate total size
    if (!validateTotalSize(selectedFiles)) {
        const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);
        errorMessages.push(`❌ Total files size too large (${formatFileSize(totalSize)}). Max total size: ${formatFileSize(maxSize)}`);
        hasErrors = true;
    }
    
    // Display error messages if any
    if (hasErrors) {
        displayValidationError(errorMessages.join('\n'));
    }
    
    updateFileList();
    updateUploadButton();
}

function updateFileList() {
    const fileList = document.getElementById('fileList');
    fileList.innerHTML = '';

    selectedFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        
        // Add validation status icon
        const isValidExt = isAllowedExtension(file.name);
        const isValidSize = validateFileSize(file);
        const statusIcon = (isValidExt && isValidSize) ? '✅' : '❌';
        
        fileItem.innerHTML = `
            <span>${statusIcon} ${file.name} (${formatFileSize(file.size)})</span>
            <button type="button" class="file-remove" onclick="removeFile(${index})">Remove</button>
        `;
        
        // Style invalid files
        if (!isValidExt || !isValidSize) {
            fileItem.style.backgroundColor = '#f8d7da';
            fileItem.style.border = '1px solid #f5c6cb';
        }
        
        fileList.appendChild(fileItem);
    });
}

function removeFile(index) {
    selectedFiles.splice(index, 1);
    updateFileList();
    updateUploadButton();
    clearValidationMessages();
}

function updateUploadButton() {
    const uploadBtn = document.getElementById('uploadBtn');
    const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);
    
    // Check if all files are valid
    const allFilesValid = selectedFiles.every(file => 
        isAllowedExtension(file.name) && validateFileSize(file)
    );
    
    if (selectedFiles.length === 0) {
        uploadBtn.disabled = true;
        uploadBtn.textContent = 'Select Files First';
        uploadBtn.style.backgroundColor = '#6c757d';
    } else if (!allFilesValid) {
        uploadBtn.disabled = true;
        uploadBtn.textContent = 'Invalid Files Selected';
        uploadBtn.style.backgroundColor = '#dc3545';
    } else if (totalSize > maxSize) {
        uploadBtn.disabled = true;
        uploadBtn.textContent = `Files too large (${formatFileSize(totalSize)} / ${formatFileSize(maxSize)})`;
        uploadBtn.style.backgroundColor = '#dc3545';
    } else {
        uploadBtn.disabled = false;
        uploadBtn.textContent = `Upload ${selectedFiles.length} Files (${formatFileSize(totalSize)})`;
        uploadBtn.style.backgroundColor = '#333';
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Real-time file extension validation
function addFileExtensionHint() {
    const uploadArea = document.getElementById('fileUploadArea');
    const hintElement = document.createElement('div');
    hintElement.innerHTML = `
        <small style="color: #666; margin-top: 10px; display: block;">
            <strong>Allowed types:</strong> ${allowedExtensions.join(', ')}<br>
            <strong>Max size per file:</strong> ${formatFileSize(maxSize)}<br>
            <strong>Max total size:</strong> ${formatFileSize(maxSize)}
        </small>
    `;
    uploadArea.appendChild(hintElement);
}

// Form submission with frontend validation
document.getElementById('fileUploadForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Clear any previous validation messages
    clearValidationMessages();
    
    // Validate folder name
    const folderName = document.getElementById('folderName').value.trim();
    if (!folderName) {
        displayValidationError('❌ Please enter a folder name.');
        return;
    }
    
    // Validate folder name characters (avoid special characters)
    if (!/^[a-zA-Z0-9_\-\s]+$/.test(folderName)) {
        displayValidationError('❌ Folder name can only contain letters, numbers, spaces, hyphens, and underscores.');
        return;
    }
    
    // Validate files selection
    if (selectedFiles.length === 0) {
        displayValidationError('❌ Please select at least one file.');
        return;
    }
    
    // Validate all files
    const invalidFiles = selectedFiles.filter(file => 
        !isAllowedExtension(file.name) || !validateFileSize(file)
    );
    
    if (invalidFiles.length > 0) {
        displayValidationError('❌ Please remove invalid files before uploading.');
        return;
    }
    
    // Validate total size
    if (!validateTotalSize(selectedFiles)) {
        const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);
        displayValidationError(`❌ Total files size (${formatFileSize(totalSize)}) exceeds the limit of ${formatFileSize(maxSize)}.`);
        return;
    }
    
    // All validations passed, proceed with upload
    uploadFiles();
});

function uploadFiles() {
    const formData = new FormData();
    const folderName = document.getElementById('folderName').value.trim();
    
    formData.append('folderName', folderName);
    selectedFiles.forEach(file => {
        formData.append('files', file);
    });

    const progressContainer = document.getElementById('progressContainer');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const uploadBtn = document.getElementById('uploadBtn');

    // Show progress immediately
    progressContainer.style.display = 'block';
    progressFill.style.width = '0%';
    progressText.textContent = 'Starting upload...';
    uploadBtn.disabled = true;
    uploadBtn.textContent = 'Uploading...';

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', function(e) {
        if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 100);
            progressFill.style.width = percentComplete + '%';
            progressText.textContent = percentComplete + '%';
            uploadBtn.textContent = `Uploading... ${percentComplete}%`;
        }
    });

    xhr.addEventListener('load', function() {
        if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            progressFill.style.width = '100%';
            progressText.textContent = 'Upload Complete!';
            uploadBtn.textContent = 'Upload Complete';
            
            setTimeout(() => {
                alert('Files uploaded successfully!');
                closeFileUploadModal();
                window.location.href = "/dashboard";
            }, 1000);
        } else {
            try {
                const error = JSON.parse(xhr.responseText);
                displayValidationError('❌ Upload failed: ' + error.error);
            } catch(e) {
                displayValidationError('❌ Upload failed: Server error');
            }
            resetUploadState();
        }
    });

    xhr.addEventListener('error', function() {
        displayValidationError('❌ Upload failed. Please check your connection and try again.');
        resetUploadState();
    });

    xhr.open('POST', '/uploadfiles');
    xhr.send(formData);
}

function resetUploadState() {
    const uploadBtn = document.getElementById('uploadBtn');
    uploadBtn.disabled = false;
    updateUploadButton(); // This will set the correct button state
}

// Initialize hints when page loads
document.addEventListener('DOMContentLoaded', function() {
    addFileExtensionHint();
});

// Close modal when clicking outside
window.addEventListener('click', function(e) {
    const modal = document.getElementById('fileUploadModal');
    if (e.target === modal) {
        closeFileUploadModal();
    }
});
