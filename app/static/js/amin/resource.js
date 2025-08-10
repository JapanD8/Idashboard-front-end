let users = [];
let connectionResources = [];
let agentResources = [];
let allResources = [];
let selectedConnections = new Set();
let selectedAgents = new Set();
let currentView = 'admin';
let currentUserView = 'john.doe';
let selectedResources = new Set();
console.log("file loaded")
// Initialize
document.addEventListener('DOMContentLoaded', function() {
  fetchUsers();
  fetchConnectionResources();
  fetchAgentResources();
});

// Update share button state
function updateShareButton() {
    const userSelected = document.getElementById('userSelect').value;
    const resourcesSelected = selectedResources.size > 0;
    const shareBtn = document.getElementById('shareBtn');
    
    shareBtn.disabled = !userSelected || !resourcesSelected;
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        month: 'short',
        day: 'numeric', 
        year: 'numeric'
    });

}
function setupEventListeners() {
  document.getElementById('userSelect').addEventListener('change', updateShareButton);
}

// Fetch users
async function fetchUsers() {
  try {
    const response = await fetch('/admin/api/users');
    const data = await response.json();
    users = data.data;
    console.log("users",users)
    const userSelect = document.getElementById('userSelect');

    // Clear existing options
    userSelect.innerHTML = '<option value="">Choose a user...</option>';
    
    // Add new options
    users.forEach(user => {
       
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = `${user.email}`;
        userSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Error fetching users:', error);
  }
}

// Fetch connection resources
async function fetchConnectionResources() {
  try {
    const response = await fetch('/admin/api/connection-resources');
    const data = await response.json();
    connectionResources = data.data;
    renderConnectionResources();
    allResources = [...connectionResources, ...agentResources];
  } catch (error) {
    console.error('Error fetching connection resources:', error);
  }
}

// Fetch agent resources
async function fetchAgentResources() {
  try {
    const response = await fetch('/admin/api/agent-resources');
    const data = await response.json();
    agentResources = data.data;
    renderAgentResources();
    allResources = [...connectionResources, ...agentResources];
  } catch (error) {
    console.error('Error fetching agent resources:', error);
  }
}



// Switch between admin and user views
function switchView(view) {
  currentView = view;
  
  // Update toggle buttons
  document.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`${view}-view`).classList.add('active');
  
  // Show/hide panels
  if (view === 'admin') {
    document.getElementById('admin-panel').style.display = 'block';
    document.getElementById('user-dashboard').style.display = 'none';
  } else {
    document.getElementById('admin-panel').style.display = 'none';
    document.getElementById('user-dashboard').style.display = 'block';
    renderUserDashboard();
  }
}

// Render connection resources grid
function renderConnectionResources() {
  const container = document.getElementById('connectionsGrid');
  
  container.innerHTML = connectionResources.map(resource => `
    <div class="resource-item" onclick="handleResourceClick('connection', '${resource.id}', event)" data-resource-id="${resource.id}">
      <input type="checkbox" class="checkbox" id="check_conn_${resource.id}" onclick="toggleResourceSelection('connection', '${resource.id}', event)">
      <div class="resource-header">
        <div class="resource-status"></div>
        <div class="resource-title">${resource.name}</div>
      </div>
      <div class="resource-meta">${resource.host}</div>
      <div class="resource-meta">Database: ${resource.database}</div>
      <div class="resource-meta">Created: ${formatDate(resource.created)}</div>
      <div class="resource-type">${resource.type}</div>
    </div>
  `).join('');
}

// Render agent resources grid
function renderAgentResources() {
  const container = document.getElementById('agentsGrid');
  
  container.innerHTML = agentResources.map(resource => `
    <div class="resource-item" onclick="handleResourceClick('agent', '${resource.id}', event)" data-resource-id="${resource.id}">
      <input type="checkbox" class="checkbox" id="check_agent_${resource.id}" onclick="toggleResourceSelection('agent', '${resource.id}', event)">
      <div class="resource-header">
        <div class="resource-status"></div>
        <div class="resource-title">${resource.name}</div>
      </div>
      
      <div class="resource-meta">Model: ${resource.model}</div>
      <div class="resource-meta">Total Files: ${resource.total_files}</div>
      <div class="resource-meta">Created: ${formatDate(resource.created)}</div>
      <div class="resource-type">${resource.type}</div>
    </div>
  `).join('');
}

// Rest of your code remains the same...

// Handle clicking on resource item (not checkbox)
function handleResourceClick(resourceId, event) {
    // Don't toggle if clicking on checkbox directly
    if (event.target.type === 'checkbox') {
        return;
    }
    
    toggleResourceSelection(resourceId);
}

// Select all connections
function selectAllConnections() {
    connectionResources.forEach(resource => {
        if (!selectedConnections.has(resource.id)) {
            selectedConnections.add(resource.id);
            const checkbox = document.getElementById(`check_conn_${resource.id}`);
            const resourceItem = checkbox.closest('.resource-item');
            checkbox.checked = true;
            resourceItem.classList.add('selected');
        }
    });
    
    updateSelectedCount();
    updateShareButton();
}

function deselectAllConnections() {
    connectionResources.forEach(resource => {
      const resourceKey = `connection_${resource.id}`;
      if (selectedResources.has(resourceKey)) {
        selectedResources.delete(resourceKey);
        selectedConnections.delete(resource.id);
        const checkbox = document.getElementById(`check_conn_${resource.id}`);
        const resourceItem = checkbox.closest('.resource-item');
        checkbox.checked = false;
        resourceItem.classList.remove('selected');
      }
    });
    
    updateSelectedCount();
    updateShareButton();
  }


function updateSelectedResourcesInput() {
    const selectedResourcesInput = document.getElementById('selectedResources');
    const selectedResourcesArray = Array.from(selectedResources);
    selectedResourcesInput.value = selectedResourcesArray.join(', ');
}


// Clear connection selections
function clearConnectionSelections() {
    selectedConnections.clear();
    
    document.querySelectorAll('#connectionsGrid .resource-item').forEach(item => {
        item.classList.remove('selected');
    });
    document.querySelectorAll('#connectionsGrid .checkbox').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    updateSelectedCount();
    updateShareButton();
}

// Select all agents
function selectAllAgents() {
    agentResources.forEach(resource => {
        if (!selectedAgents.has(resource.id)) {
            selectedAgents.add(resource.id);
            const checkbox = document.getElementById(`check_agent_${resource.id}`);
            const resourceItem = checkbox.closest('.resource-item');
            checkbox.checked = true;
            resourceItem.classList.add('selected');
        }
    });
    
    updateSelectedCount();
    updateShareButton();
}

// Clear agent selections
function clearAgentSelections() {
    selectedAgents.clear();
    
    document.querySelectorAll('#agentsGrid .resource-item').forEach(item => {
        item.classList.remove('selected');
    });
    document.querySelectorAll('#agentsGrid .checkbox').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    updateSelectedCount();
    updateShareButton();
}

// Toggle resource selection
function toggleResourceSelection(type, resourceId, event) {
    // Prevent event bubbling if called from checkbox
    if (event && event.target && event.target.type === 'checkbox') {
        event.stopPropagation();
    }
    
    let checkboxId;
    if (type === 'connection') {
        checkboxId = `check_conn_${resourceId}`;
    } else if (type === 'agent') {
        checkboxId = `check_agent_${resourceId}`;
    }
    
    const checkbox = document.getElementById(checkboxId);
    
    if (!checkbox) {
        console.error(`Checkbox not found for ${checkboxId}`);
        return;
    }
    
    const resourceItem = checkbox.closest('.resource-item');
    const resourceKey = `${type}_${resourceId}`;
    const resourceNameElement = resourceItem.querySelector('.resource-title');
    const resourceName = resourceNameElement.textContent.trim();
    
    let prefix;
    if (type === 'connection') {
        prefix = '🔗 ';
    } else {
        prefix = '🤖 ';
    }
    
    if (selectedResources.has(resourceKey)) {
        selectedResources.delete(resourceKey);
        if (type === 'connection') {
            selectedConnections.delete(resourceId);
        } else {
            selectedAgents.delete(resourceId);
        }
        checkbox.checked = false;
        resourceItem.classList.remove('selected');
    } else {
        selectedResources.add(resourceKey);
        if (type === 'connection') {
            selectedConnections.add(resourceId);
        } else {
            selectedAgents.add(resourceId);
        }
        checkbox.checked = true;
        resourceItem.classList.add('selected');
    }
    
    updateSelectedCount();
    updateShareButton();
    
    const selectedResourcesInput = document.getElementById('selectedResources');
    const selectedNames = [];
    
    // Add selected connection names
    Array.from(selectedConnections).forEach(id => {
        const resourceItem = document.querySelector(`.resource-item[data-resource-id="${id}"]`);
        const resourceNameElement = resourceItem.querySelector('.resource-title');
        selectedNames.push(`🔗 ${resourceNameElement.textContent.trim()}`);
    });
    
    // Add selected agent names
    Array.from(selectedAgents).forEach(id => {
        const resourceItem = document.querySelector(`.resource-item[data-resource-id="${id}"]`);
        const resourceNameElement = resourceItem.querySelector('.resource-title');
        selectedNames.push(`🤖 ${resourceNameElement.textContent.trim()}`);
    });
    
    selectedResourcesInput.value = selectedNames.join(', ');
}

// Update selected count display
function updateSelectedCount() {
    const connectionCount = selectedConnections.size;
    const agentCount = selectedAgents.size;
    const totalCount = connectionCount + agentCount;
    
    document.getElementById('selectedCount').textContent = `(${totalCount})`;
    
    const selectedNames = [];
    
    // Add selected connection names
    Array.from(selectedConnections).forEach(id => {
        const resource = connectionResources.find(r => r.id === id);
        if (resource) selectedNames.push(`🔗 ${resource.name}`);
    });
    
    // Add selected agent names
    Array.from(selectedAgents).forEach(id => {
        const resource = agentResources.find(r => r.id === id);
        if (resource) selectedNames.push(`🤖 ${resource.name}`);
    });
    
    document.getElementById('selectedResources').value = selectedNames.join(', ');
}



// Share resources with selected user
async function shareResources() {
    const selectedUser = document.getElementById('userSelect').value;
    const resourceIds = Array.from(selectedResources);
    
    if (!selectedUser || resourceIds.length === 0) {
        showNotification('Please select a user and at least one resource', 'error');
        return;
    }

    // Show loading state
    const shareBtn = document.getElementById('shareBtn');
    const originalText = shareBtn.textContent;
    shareBtn.textContent = 'Sharing...';
    shareBtn.disabled = true;
    document.body.classList.add('loading');

    try {
        // Simulate API call
        const response = await simulateAPICall('/api/share', {
            method: 'POST',
            body: JSON.stringify({
                user_id: selectedUser,
                resource_ids: resourceIds,
                shared_by: 'admin'
            })
        });

        if (response.success) {
            // Update local data
            resourceIds.forEach(resourceId => {
                const resource = allResources.find(r => r.id === resourceId);
                if (resource && !resource.shared_with.includes(selectedUser)) {
                    resource.shared_with.push(selectedUser);
                }
            });

            // Reset form
            selectedResources.clear();
            document.getElementById('userSelect').value = '';
            document.getElementById('selectedResources').value = '';
            
            // Clear all selections
            document.querySelectorAll('.resource-item').forEach(item => {
                item.classList.remove('selected');
            });
            document.querySelectorAll('.checkbox').forEach(checkbox => {
                checkbox.checked = false;
            });
            
            updateSelectedCount();
            updateShareButton();
            
            const userName = users.find(u => u.id === selectedUser)?.name || selectedUser;
            showNotification(`Successfully shared ${resourceIds.length} resource(s) with ${userName}`, 'success');
        } else {
            throw new Error(response.message || 'Sharing failed');
        }
    } catch (error) {
        console.error('Error sharing resources:', error);
        showNotification('Failed to share resources. Please try again.', 'error');
    } finally {
        // Reset loading state
        shareBtn.textContent = originalText;
        shareBtn.disabled = false;
        document.body.classList.remove('loading');
        updateShareButton();
    }
}
setupEventListeners();