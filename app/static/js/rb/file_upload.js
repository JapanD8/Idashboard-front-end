
document.addEventListener('DOMContentLoaded', function() {
    // Your code here



    




    const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200 MB

    document.getElementById('fileInput').addEventListener('change', function() {
        const files = this.files;
        let totalSize = 0;

        Array.from(files).forEach(file => {
            totalSize += file.size;
        });

        if (totalSize > MAX_FILE_SIZE) {
            alert(`Total file size exceeds the maximum limit of 200 MB.`);
            this.value = ''; // Clear the file input
            document.getElementById('selectedFiles').innerHTML = '';
            return;
        }

        const fileList = document.getElementById('selectedFiles');
        fileList.innerHTML = '';

        Array.from(files).forEach((file, index) => {
            const fileElement = document.createElement('div');
            fileElement.classList.add('selected-file');
            fileElement.innerHTML = `
                <span>${file.name} (${formatFileSize(file.size)})</span>
                <button class="delete-file" data-index="${index}">Delete</button>
            `;
            fileList.appendChild(fileElement);
        });

        // Add event listener to delete buttons
        const deleteButtons = document.getElementsByClassName('delete-file');
        Array.from(deleteButtons).forEach(button => {
            button.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                const fileList = document.getElementById('fileInput').files;
                const newFileList = new DataTransfer();

                Array.from(fileList).forEach((file, i) => {
                    if (i !== index) {
                        newFileList.items.add(file);
                    }
                });

                document.getElementById('fileInput').files = newFileList.files;
                document.getElementById('fileInput').dispatchEvent(new Event('change'));
            });
        });
    });

    // Function to format file size
    function formatFileSize(size) {
        if (size < 1024) {
            return size + ' bytes';
        } else if (size < 1024 * 1024) {
            return (size / 1024).toFixed(2) + ' KB';
        } else {
            return (size / (1024 * 1024)).toFixed(2) + ' MB';
        }
    }



    document.getElementById('uploadForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const fileInput = document.getElementById('fileInput');
        const files = fileInput.files;
    
        // Create a new FormData object
        const formData = new FormData();
    
        // Add files to the FormData object
        Array.from(files).forEach(file => {
            formData.append('files', file);
        });
    
        // Add other form data if needed
        formData.append('topicName', document.getElementById('topicName').value);
        formData.append('agentType', document.getElementById('agentType').value);
    
        // Update the upload status
        document.getElementById('uploadProgress').innerHTML = 'Uploading... 0%';
    
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/rb/uploadfiles', true);

        
    
        xhr.upload.addEventListener('progress', function(event) {
            if (event.lengthComputable) {
                const progress = (event.loaded / event.total) * 100;
                document.getElementById('uploadProgress').innerHTML = `Uploading... ${Math.round(progress)}%`;
            }
        });
    
        xhr.addEventListener('load', function() {
            console.log(`Status code: ${xhr.status}`);
            console.log(`Response text: ${xhr.responseText}`);
            if (xhr.status === 200) {
                document.getElementById('uploadProgress').innerHTML = 'Upload complete!';
                // Redirect to a new URL after upload complete
                window.location.href = '/rb/assitant';
            } else {
                document.getElementById('uploadProgress').innerHTML = 'Error uploading files';
                console.error('Error uploading files');
            }
        });
        xhr.send(formData);
        
    });





});
