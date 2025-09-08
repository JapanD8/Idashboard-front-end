// let topics = [
//     {
//         id: 1,
//         title: "Shipping Schedule Management",
//         agent: "dock",
//         date: "2025-07-30",
//         file: "shipping_schedule.pdf",
//         description: "Dock Management"
//     },
//     {
//         id: 2,
//         title: "Warehouse Inventory System",
//         agent: "dock",
//         date: "2025-07-29",
//         file: "inventory_system.docx",
//         description: "Dock Management"
//     },
//     {
//         id: 3,
//         title: "Employee Onboarding Process",
//         agent: "hr",
//         date: "2025-07-28",
//         file: "onboarding_guide.pdf",
//         description: "HR Management"
//     },
//     {
//         id: 4,
//         title: "Performance Review Guidelines",
//         agent: "hr",
//         date: "2025-07-27",
//         file: "performance_review.pdf",
//         description: "HR Management"
//     },
//     {
//         id: 5,
//         title: "Budget Planning 2025",
//         agent: "fin",
//         date: "2025-07-26",
//         file: "budget_2025.xlsx",
//         description: "Finance Management"
//     },
//     {
//         id: 6,
//         title: "Expense Report Template",
//         agent: "fin",
//         date: "2025-07-25",
//         file: "expense_template.pdf",
//         description: "Finance Management"
//     }
// ];

let currentFilter = 'all';
let selectedAgent = null;


async function fetchTopics() {
    try {
        const response = await fetch('/rb/api/topics'); // Replace with your API endpoint
        console.log("response.ok",response.ok)
        if (!response.ok) {
            throw new Error('Failed to fetch topics');
        }
        const topicsData = await response.json();
        console.log("topicsData",topicsData.data)
        return topicsData;
    } catch (error) {
        console.error('Error fetching topics:', error);
        return [];
    }
}


// function openModal(connectionId,connectiontype) {
//     currentConnectionId = connectionId;
//     currentConnectiontype =connectiontype;
//     $('#confirmModal').modal('show');
//     console.log('Modal opened for connection ID:', connectionId);
//   }
  
function closeModal() {
    currentConnectionId = null;
    currentConnectiontype =null;
    $('#confirmModal').modal('hide');
    console.log('Modal closed');
  }

function openModal(connectionId, connectiontype) {
    currentConnectionId = connectionId;
    currentConnectiontype = connectiontype;
    $('#confirmModal').modal('show');
    console.log('Modal opened for connection ID:', connectionId);
}

$('#confirmDeleteBtn').off('click').on('click', function() {
    if (currentConnectionId) {
        console.log('Confirm delete clicked for connection ID:', currentConnectionId); 
        const deledata = {connectionid: currentConnectionId, type : currentConnectiontype};
        fetch(`/connections/${currentConnectionId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(deledata)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('Connection deleted successfully:', data); 
                const card = document.getElementById(`label-${currentConnectionId}`);
                if (card) {
                    card.remove();
                }
                $('#confirmModal').modal('hide');
                location.reload();
            } else {
                console.error('Failed to delete connection:', data.error); 
                alert('Failed to delete connection: ' + data.error);
                $('#confirmModal').modal('hide');
            }
        })
        .catch(error => {
            console.error('Error:', error); 
            alert('An error occurred while deleting the connection.');
            $('#confirmModal').modal('hide');
        });
    }
});


$('#cancelDeleteBtn').off('click').on('click', function() {
    $('#confirmModal').modal('hide');
});



async function renderTopics() {
    const topicss = await fetchTopics();
    const topics =  topicss.data;
    const container = document.getElementById('topics-container');

    
    let filteredTopics = topics;

    if (currentFilter !== 'all') {
        filteredTopics = topics.filter(topic => topic.agent === currentFilter);
    }

    if (filteredTopics.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📝</div>
                <h3>No topics found</h3>
                <p>Upload a new topic to get started</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filteredTopics.map(topic => `
    <div class="topic-card" id="label-${topic.id}">
        <div class="topic-header">
            <div class="topic-status"></div>
            <div class="topic-title">${topic.name}</div>
        </div>
        <div class="topic-actions">
            <button class="action-btn" data-connection-id="${topic.id}" onclick="editTopic(${topic.id})">✏️</button>
            <button class="action-btn" data-connection-id="${topic.id}" onclick="deleteTopic(${topic.id})">🗑️</button>
        </div>
        <div class="topic-description">${topic.description}</div>
        <div class="topic-meta">
            <div>Created: ${formatDate(topic.created_at)}</div>
            ${topic.folder_type === 'shared' ? `<div>Shared by: <span style="color: rgb(16, 97, 173);">Admin</span></div>` : ''}
        </div>
        <div class="topic-buttons">
            <button class="btn btn-chat" data-connection-id="${topic.id}" data-connections-type="${topic.folder_type}" data-connections-typeid="${topic.folder_id}">Chat</button>
        </div>
    </div>
    `).join('');
    //${topic.folder_type === 'shared' ? `<br>Shared by: <span style="color: blue;">admin</span>` : ''}
    //<button class="btn btn-secret" data-connection-id="${topic.id}">Get Secret</button>
    //<button class="btn btn-collaborators" data-connection-id="${topic.id}" onclick="showCollaborators(${topic.id})">
    //            👥 ${topic.collaborators ? topic.collaborators.length : 0}
    // Add event listeners for chat buttons
    const filechatButtons = document.querySelectorAll('.btn.btn-chat');
    filechatButtons.forEach(button => {
        button.addEventListener("click", function(){
            console.log("Chat button clicked!");
            const chatId = button.getAttribute("data-connection-id");
            const savedStatus = sessionStorage.getItem(`conn_status_${chatId}`);
            console.log("connectButton", chatId, savedStatus);
            const ctype = this.getAttribute("data-connections-type");
            sessionStorage.setItem(chatId, ctype);
            const ctype_id = this.getAttribute("data-connections-typeid");
            sessionStorage.setItem( ctype+"_"+chatId, ctype_id);
            window.location.href = `/rb/chat/${chatId}`;
        });
    });



    // Get the delete icons
    const deleteIcons = document.getElementsByClassName('action-btn');
    Array.from(deleteIcons).forEach(icon => {
        if (icon.innerHTML.includes('🗑️')) {
            icon.addEventListener('click', function(event) {
                event.stopPropagation(); 
                const connectionId = this.getAttribute('data-connection-id');
                console.log('Delete icon clicked with connection ID:', connectionId); 
                openModal(connectionId, 'folder'); // Assuming the type is 'topic'
            });
        }
    });
}


// Initialize the page
document.addEventListener('DOMContentLoaded', async function() {
    let topics = null;

    // Try to load from localStorage
    const storedTopics = localStorage.getItem('topics');
    if (storedTopics) {
        topics = JSON.parse(storedTopics);
        console.log("Loaded topics from localStorage", topics);
    } else {
        // Call API and store in localStorage
        topics = await fetchTopics();
        console.log("Fetched topics from API", topics);
        localStorage.setItem('topics', JSON.stringify(topics));
    }

    await renderTopics(topics);
    setupFileUpload();
});

// Agent card selection
document.querySelectorAll('.agent-card').forEach(card => {
    card.addEventListener('click', function(e) {
        if (e.target.closest('.agent-buttons') || e.target.closest('.agent-actions')) return;
        
        // Remove previous selection
        document.querySelectorAll('.agent-card').forEach(c => c.classList.remove('selected'));
        
        // Add selection to clicked card
        this.classList.add('selected');
        selectedAgent = this.dataset.agent;
        
        // Filter topics for selected agent
        filterTopics(selectedAgent);
    });
});

// Open upload modal
function openUploadModal(agentType) {
    console.log(`openmodal clicked ${agentType}`)
    // selectedAgent = agentType;
    const agentNames = {
        'dock': 'Dock Agent',
        'hr': 'HR Agent', 
        'fin': 'Finance Agent'
    };
    document.getElementById('agentType').value = agentNames[agentType];
    // document.getElementById('uploadModal').classList.add('show');
    // document.getElementById('topicName').focus();
    document.getElementById('uploadModal').style.display = 'block';
}

// Close upload modal
function closeUploadModal() {
    document.getElementById('uploadModal').style.display = 'none';
}

// Handle form submission
document.getElementById('uploadForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const topicName = document.getElementById('topicName').value;
    console.log("topicName", topicName)
    const fileInput = document.getElementById('fileInput');
    
    if (!fileInput.files[0]) {
        alert('Please select a file to upload');
        return;
    }

    // Create new topic
    const newTopic = {
        id: topics.length + 1,
        title: topicName,
        agent: selectedAgent,
        date: new Date().toISOString().split('T')[0],
        file: fileInput.files[0].name,
        description: getAgentDescription(selectedAgent)
    };

    // Add to topics array
    topics.unshift(newTopic);
    
    // Close modal and refresh topics
    closeUploadModal();
    renderTopics();
    
    // Show success message
    showNotification('Topic uploaded successfully!', 'success');
});

// Filter topics
function filterTopics(filter) {
    currentFilter = filter;
    
    // Update filter button states
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`filter-${filter}`).classList.add('active');
    
    renderTopics();
}




// Render topics
// function renderTopics() {
//     const container = document.getElementById('topics-container');
//     let filteredTopics = topics;

//     if (currentFilter !== 'all') {
//         filteredTopics = topics.filter(topic => topic.agent === currentFilter);
//     }

//     if (filteredTopics.length === 0) {
//         container.innerHTML = `
//             <div class="empty-state">
//                 <div class="empty-icon">📝</div>
//                 <h3>No topics found</h3>
//                 <p>Upload a new topic to get started</p>
//             </div>
//         `;
//         return;
//     }

//     container.innerHTML = filteredTopics.map(topic => `
//         <div class="topic-card">
//             <div class="topic-header">
//                 <div class="topic-status"></div>
//                 <div class="topic-title">${topic.title}</div>
//             </div>
//             <div class="topic-actions">
//                 <button class="action-btn">✏️</button>
//                 <button class="action-btn">🗑️</button>
//             </div>
//             <div class="topic-description">${topic.description}</div>
//             <div class="topic-meta">Created: ${formatDate(topic.date)}</div>
//             <div class="topic-buttons">
//                 <button class="btn btn-connect">Chat</button>
//                 <button class="btn btn-secret">Get Secret</button>
//             </div>
//         </div>
//     `).join('');
// }

// Helper functions
function getAgentDescription(agent) {
    const descriptions = {
        'dock': 'Dock Management',
        'hr': 'HR Management',
        'fin': 'Finance Management'
    };
    return descriptions[agent] || agent;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        month: 'short',
        day: 'numeric', 
        year: 'numeric'
    });
}

// File upload setup
function setupFileUpload() {
    const fileUpload = document.querySelector('.file-upload');
    const fileInput = document.getElementById('fileInput');

    // Drag and drop functionality
    fileUpload.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.classList.add('dragover');
    });

    fileUpload.addEventListener('dragleave', function(e) {
        e.preventDefault();
        this.classList.remove('dragover');
    });

    fileUpload.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
            updateFileUploadText(files[0].name);
        }
    });

    // File input change
    fileInput.addEventListener('change', function() {
        if (this.files[0]) {
            updateFileUploadText(this.files[0].name);
        }
    });
}

function updateFileUploadText(fileName) {
    document.querySelector('.upload-text').textContent = `Selected: ${fileName}`;
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : '#3b82f6'};
        color: white;
        padding: 0.75rem 1rem;
        border-radius: 6px;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        font-size: 0.875rem;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Hide notification after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Close modal when clicking outside
document.getElementById('uploadModal').addEventListener('click', function(e) {
    console.log("upload modal clicked",e.target)
    if (e.target === this) {
        closeUploadModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeUploadModal();
    }
});

const logoutButton = document.getElementById('logout-button');

logoutButton.addEventListener('click', () => {
    sessionStorage.clear();
    localStorage.clear();
    window.location.href = '/login'; // redirect to login page
});

//<link rel="stylesheet" href="{{ url_for('static', filename='css/ai_agents.css') }}">
//<script src="{{ url_for('static', filename='js/rb/ai_agents.js') }}"></script>
