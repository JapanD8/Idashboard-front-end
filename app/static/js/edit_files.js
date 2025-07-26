let editSelectedFiles = [];
let currentEditFolder = '';
let existingFiles = [];

// Function to open edit modal (call this from your folder list)
function openEditFolderModal(folderName) {
    currentEditFolder = folderName;
    document.getElementById('editFolderModal').style.display = 'block';
    document.getElementById('editFolderTitle').textContent = folderName;
    document.getElementById('editFolderName').value = folderName;
    document.getElementById('originalFolderName').value = folderName;
    
    // Reset form state
    editSelectedFiles = [];
    existingFiles = [];
    updateNewFilesList();
    clearEditValidationMessages();
    
    // Load existing files
    loadFolderContents(folderName);
}

function closeEditFolderModal() {
    document.getElementById('editFolderModal').style.display = 'none';
    resetEditForm();
}

function resetEditForm() {
    document.getElementById('editFolderForm').reset();
    editSelectedFiles = [];
    existingFiles = [];
    updateExistingFilesList();
    updateNewFilesList();
    document.getElementById('editProgressContainer').style.display = 'none';
    clearEditValidationMessages();
}

// Load folder contents from server
async function loadFolderContents(folderName) {
    try {
        const response = await fetch(`/folder/${encodeURIComponent(folderName)}`);
        if (response.ok) {
            const data = await response.json();
            existingFiles = data.files || [];
            updateExistingFilesList();
        } else {
            displayEditValidationError('Failed to load folder contents');
        }
    } catch (error) {
        displayEditValidationError('Error loading folder contents: ' + error.message);
    }
}

function updateExistingFilesList() {
    const container = document.getElementById('existingFilesList');
    container.innerHTML = '';
    
    if (existingFiles.length === 0) {
        container.innerHTML = '<div class="empty-folder">No files in this folder</div>';
        return;
    }
    
    existingFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'existing-file-item';
        fileItem.innerHTML = `
            <div class="existing-file-info">
                <div class="existing-file-name">📄 ${file.name}</div>
                <div class="existing-file-size">${formatFileSize(file.size)}</div>
            </div>
            <button type="button" class="file-delete-btn" onclick="deleteExistingFile('${file.name}', ${index})">
                Delete
            </button>
        `;
        container.appendChild(fileItem);
    });
}

// Delete existing file
async function deleteExistingFile(fileName, index) {
    if (!confirm(`Are you sure you want to delete "${fileName}"?`)) {
        return;
    }
    
    try {
        const response = await fetch('/delete_file', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                folderName: currentEditFolder,
                fileName: fileName
            })
        });
        
        if (response.ok) {
            existingFiles.splice(index, 1);
            updateExistingFilesList();
        } else {
            const error = await response.json();
            displayEditValidationError('Failed to delete file: ' + error.error);
        }
    } catch (error) {
        displayEditValidationError('Error deleting file: ' + error.message);
    }
}

// File upload area events for edit modal
const editFileUploadArea = document.getElementById('editFileUploadArea');
const editFileInput = document.getElementById('editFileInput');

editFileUploadArea.addEventListener('click', () => editFileInput.click());

editFileUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    editFileUploadArea.classList.add('dragover');
});

editFileUploadArea.addEventListener('dragleave', () => {
    editFileUploadArea.classList.remove('dragover');
});

editFileUploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    editFileUploadArea.classList.remove('dragover');
    handleEditFiles(e.dataTransfer.files);
});

editFileInput.addEventListener('change', (e) => {
    handleEditFiles(e.target.files);
});

function handleEditFiles(files) {
    clearEditValidationMessages();
    let hasErrors = false;
    let errorMessages = [];
    
    for (let file of files) {
        // Check if file already exists in new files
        if (editSelectedFiles.find(f => f.name === file.name)) {
            continue;
        }
        
        // Check if file exists in existing files
        if (existingFiles.find(f => f.name === file.name)) {
            errorMessages.push(`❌ "${file.name}": File already exists in folder`);
            hasErrors = true;
            continue;
        }
        
        // Validate file extension
        if (!isAllowedExtension(file.name)) {
            errorMessages.push(`❌ "${file.name}": File type not allowed`);
            hasErrors = true;
            continue;
        }
        
        // Validate individual file size
        if (!validateFileSize(file)) {
            errorMessages.push(`❌ "${file.name}": File too large (${formatFileSize(file.size)})`);
            hasErrors = true;
            continue;
        }
        
        editSelectedFiles.push(file);
    }
    
    // Validate total size (existing + new files)
    const existingTotalSize = existingFiles.reduce((sum, file) => sum + file.size, 0);
    const newTotalSize = editSelectedFiles.reduce((sum, file) => sum + file.size, 0);
    const totalSize = existingTotalSize + newTotalSize;
    
    if (totalSize > maxSize) {
        errorMessages.push(`❌ Total folder size too large (${formatFileSize(totalSize)}). Max: ${formatFileSize(maxSize)}`);
        hasErrors = true;
    }
    
    if (hasErrors) {
        displayEditValidationError(errorMessages.join('\n'));
    }
    
    updateNewFilesList();
    updateEditButton();
}

function updateNewFilesList() {
    const fileList = document.getElementById('newFilesList');
    fileList.innerHTML = '';

    if (editSelectedFiles.length === 0) {
        return;
    }

    editSelectedFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        
        const isValidExt = isAllowedExtension(file.name);
        const isValidSize = validateFileSize(file);
        const statusIcon = (isValidExt && isValidSize) ? '✅' : '❌';
        
        fileItem.innerHTML = `
            <span>${statusIcon} ${file.name} (${formatFileSize(file.size)}) <em>- New</em></span>
            <button type="button" class="file-remove" onclick="removeEditFile(${index})">Remove</button>
        `;
        
        if (!isValidExt || !isValidSize) {
            fileItem.style.backgroundColor = '#f8d7da';
            fileItem.style.border = '1px solid #f5c6cb';
        }
        
        fileList.appendChild(fileItem);
    });
}

function removeEditFile(index) {
    editSelectedFiles.splice(index, 1);
    updateNewFilesList();
    updateEditButton();
    clearEditValidationMessages();
}

function updateEditButton() {
    const updateBtn = document.getElementById('updateBtn');
    const existingTotalSize = existingFiles.reduce((sum, file) => sum + file.size, 0);
    const newTotalSize = editSelectedFiles.reduce((sum, file) => sum + file.size, 0);
    const totalSize = existingTotalSize + newTotalSize;
    
    const allNewFilesValid = editSelectedFiles.every(file => 
        isAllowedExtension(file.name) && validateFileSize(file)
    );
    
    if (!allNewFilesValid && editSelectedFiles.length > 0) {
        updateBtn.disabled = true;
        updateBtn.textContent = 'Invalid Files Selected';
        updateBtn.style.backgroundColor = '#dc3545';
    } else if (totalSize > maxSize) {
        updateBtn.disabled = true;
        updateBtn.textContent = `Folder too large (${formatFileSize(totalSize)})`;
        updateBtn.style.backgroundColor = '#dc3545';
    } else {
        updateBtn.disabled = false;
        const newFilesText = editSelectedFiles.length > 0 ? ` (+${editSelectedFiles.length} new)` : '';
        updateBtn.textContent = `Update Folder${newFilesText}`;
        updateBtn.style.backgroundColor = '#333';
    }
}

function displayEditValidationError(message) {
    let errorDiv = document.getElementById('editValidationError');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'editValidationError';
        errorDiv.style.cssText = `
            color: #dc3545;
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
            border-radius: 4px;
            padding: 10px;
            margin: 10px 0;
            font-size: 14px;
            white-space: pre-line;
        `;
        document.getElementById('newFilesList').parentNode.insertBefore(errorDiv, document.getElementById('newFilesList'));
    }
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

function clearEditValidationMessages() {
    const errorDiv = document.getElementById('editValidationError');
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
}

// Form submission for edit
document.getElementById('editFolderForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    clearEditValidationMessages();
    
    const newFolderName = document.getElementById('editFolderName').value.trim();
    if (!newFolderName) {
        displayEditValidationError('❌ Please enter a folder name.');
        return;
    }
    
    if (!/^[a-zA-Z0-9_\-\s]+$/.test(newFolderName)) {
        displayEditValidationError('❌ Folder name can only contain letters, numbers, spaces, hyphens, and underscores.');
        return;
    }
    
    updateFolder();
});

async function updateFolder() {
    const formData = new FormData();
    const originalFolderName = document.getElementById('originalFolderName').value;
    const newFolderName = document.getElementById('editFolderName').value.trim();
    
    formData.append('originalFolderName', originalFolderName);
    formData.append('newFolderName', newFolderName);
    
    editSelectedFiles.forEach(file => {
        formData.append('newFiles', file);
    });

    const progressContainer = document.getElementById('editProgressContainer');
    const progressFill = document.getElementById('editProgressFill');
    const progressText = document.getElementById('editProgressText');
    const updateBtn = document.getElementById('updateBtn');

    progressContainer.style.display = 'block';
    progressFill.style.width = '0%';
    progressText.textContent = 'Updating folder...';
    updateBtn.disabled = true;
    updateBtn.textContent = 'Updating...';

    try {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', function(e) {
            if (e.lengthComputable) {
                const percentComplete = Math.round((e.loaded / e.total) * 100);
                progressFill.style.width = percentComplete + '%';
                progressText.textContent = percentComplete + '%';
                updateBtn.textContent = `Updating... ${percentComplete}%`;
            }
        });

        xhr.addEventListener('load', function() {
            if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                progressFill.style.width = '100%';
                progressText.textContent = 'Update Complete!';
                updateBtn.textContent = 'Update Complete';
                
                setTimeout(() => {
                    alert('Folder updated successfully!');
                    closeEditFolderModal();
                    // Refresh folder list if you have one
                    if (typeof refreshFolderList === 'function') {
                        refreshFolderList();
                    }
                }, 1000);
            } else {
                const error = JSON.parse(xhr.responseText);
                displayEditValidationError('❌ Update failed: ' + error.error);
                resetEditUploadState();
            }
        });

        xhr.addEventListener('error', function() {
            displayEditValidationError('❌ Update failed. Please try again.');
            resetEditUploadState();
        });

        xhr.open('POST', '/update_folder');
        xhr.send(formData);

    } catch (error) {
        displayEditValidationError('❌ Update failed: ' + error.message);
        resetEditUploadState();
    }
}

function resetEditUploadState() {
    const updateBtn = document.getElementById('updateBtn');
    updateBtn.disabled = false;
    updateEditButton();
}
