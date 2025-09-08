let users = [];
let connectionResources = [];
let agentResources = [];
let allResources = [];
let selectedConnections = new Set();
let selectedAgents = new Set();
let currentView = 'admin';
let currentUserView = 'john.doe';
let selectedResources = new Set();
const resourceNameMap = new Map();
let userPermissions = {};

    
console.log("file loaded")
// Initialize
document.addEventListener('DOMContentLoaded', function() {
  fetchUsers();
  fetchConnectionResources();
  fetchAgentResources();
  
});

// Update share button state
// function updateShareButton() {
//     const userSelected = document.getElementById('userSelect').value;
//     const resourcesSelected = selectedResources.size > 0;
//     const shareBtn = document.getElementById('shareBtn');
    
//     shareBtn.disabled = !userSelected || !resourcesSelected;
// }

function updateShareButton() {
  const userSelected = document.getElementById('userSelect').value;
  const resourcesSelected = selectedConnections.size > 0 || selectedAgents.size > 0;
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

// Fetch users working-code
// async function fetchUsers() {
//   try {
//     const response = await fetch('/admin/api/users');
//     const data = await response.json();
//     users = data.data;
//     console.log("users",users)
//     const userSelect = document.getElementById('userSelect');

//     // Clear existing options
//     userSelect.innerHTML = '<option value="">Choose a user...</option>';
    
//     // Add new options
//     users.forEach(user => {
       
//         const option = document.createElement('option');
//         option.value = user.id;
//         option.textContent = `${user.email}`;
//         userSelect.appendChild(option);
//     });
//   } catch (error) {
//     console.error('Error fetching users:', error);
//   }
// }

//--fetch user ------------------------------------------------

async function fetchUsers() {
    try {
        const response = await fetch('/admin/api/users');
        const data = await response.json();
        users = data.data;
        console.log("user permission", users)
        userPermissions = {};

        users.forEach(user => {
            userPermissions[user.id] = user.permissions || [];
        });

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

        // Add event listener to user select
        // userSelect.addEventListener('change', function() {
        // updateResourceSelections();
        // });
    } 
    catch (error) {
        console.error('Error fetching users:', error);
    }
}

// function updateResourceSelections() {
//     const selectedUserId = document.getElementById('userSelect').value;
//     if (!selectedUserId) {
//     // Reset all checkboxes and selections when no user is selected
//     connectionResources.forEach(resource => {
//         document.getElementById(`check_conn_${resource.id}`).checked = false;
//         document.querySelector(`[data-resource-id="${resource.id}"]`).classList.remove('selected');
//     });
//     agentResources.forEach(resource => {
//         document.getElementById(`check_agent_${resource.id}`).checked = false;
//         document.querySelector(`[data-resource-id="${resource.id}"]`).classList.remove('selected');
//     });
//     selectedConnections.clear();
//     selectedAgents.clear();
//     updateSelectedCount();
//     return;
//     }

//     const permissions = userPermissions[selectedUserId];
//     selectedConnections.clear();
//     selectedAgents.clear();

//     permissions.forEach(permission => {
//     if (connectionResources.find(resource => `connection_${resource.id}` === permission)) {
//         const resourceId = connectionResources.find(resource => `connection_${resource.id}` === permission).id;
//         selectedConnections.add(resourceId);
//         document.getElementById(`check_conn_${resourceId}`).checked = true;
//         document.querySelector(`[data-resource-id="${resourceId}"]`).classList.add('selected');
//     } else if (agentResources.find(resource => `agent_${resource.id}` === permission)) {
//         const resourceId = agentResources.find(resource => `agent_${resource.id}` === permission).id;
//         selectedAgents.add(resourceId);
//         document.getElementById(`check_agent_${resourceId}`).checked = true;
//         document.querySelector(`[data-resource-id="${resourceId}"]`).classList.add('selected');
//     }
//     });

//     // Uncheck resources that are not in permissions
//     connectionResources.forEach(resource => {
//     if (!permissions.includes(`connection_${resource.id}`)) {
//         document.getElementById(`check_conn_${resource.id}`).checked = false;
//         document.querySelector(`[data-resource-id="${resource.id}"]`).classList.remove('selected');
//         if (selectedConnections.has(resource.id)) {
//         selectedConnections.delete(resource.id);
//         }
//     }
//     });

//     agentResources.forEach(resource => {
//     if (!permissions.includes(`agent_${resource.id}`)) {
//         document.getElementById(`check_agent_${resource.id}`).checked = false;
//         document.querySelector(`[data-resource-id="${resource.id}"]`).classList.remove('selected');
//         if (selectedAgents.has(resource.id)) {
//         selectedAgents.delete(resource.id);
//         }
//     }
//     });

//     updateSelectedCount();
//     updateShareButton();
//   //updateRemoveButton();
// }
function updateResourceSelections() {
    const selectedUserId = document.getElementById('userSelect').value;
    if (!selectedUserId) {
        // Reset all checkboxes and selections when no user is selected
        connectionResources.forEach(resource => {
            document.getElementById(`check_conn_${resource.id}`).checked = false;
            document.querySelector(`[data-resource-id="${resource.id}"]`).classList.remove('selected');
        });
        agentResources.forEach(resource => {
            document.getElementById(`check_agent_${resource.id}`).checked = false;
            document.querySelector(`[data-resource-id="${resource.id}"]`).classList.remove('selected');
        });
        selectedConnections.clear();
        selectedAgents.clear();
        resourceNameMap.clear();
        selectedResources.clear();
        updateSelectedCount();
        updateSelectedResourcesInput();
        return;
    }

    // Uncheck all checkboxes
    connectionResources.forEach(resource => {
        document.getElementById(`check_conn_${resource.id}`).checked = false;
        document.querySelector(`[data-resource-id="${resource.id}"]`).classList.remove('selected');
    });
    agentResources.forEach(resource => {
        document.getElementById(`check_agent_${resource.id}`).checked = false;
        document.querySelector(`[data-resource-id="${resource.id}"]`).classList.remove('selected');
    });

    resourceNameMap.clear();
    selectedResources.clear();
    selectedConnections.clear();
    selectedAgents.clear();

    const permissions = userPermissions[selectedUserId];
    permissions.forEach(permission => {
        if (connectionResources.find(resource => `connection_${resource.id}` === permission)) {
            const resourceId = connectionResources.find(resource => `connection_${resource.id}` === permission).id;
            document.getElementById(`check_conn_${resourceId}`).checked = true;
            document.querySelector(`[data-resource-id="${resourceId}"]`).classList.add('selected');
            selectedConnections.add(resourceId);
            const resource = connectionResources.find(r => r.id === resourceId);
            const resourceKey = `connection_${resourceId}`;
            const resourceName = `🔗 ${resource.name}`;
            selectedResources.add(resourceKey);
            resourceNameMap.set(resourceKey, resourceName);
        } else if (agentResources.find(resource => `agent_${resource.id}` === permission)) {
            const resourceId = agentResources.find(resource => `agent_${resource.id}` === permission).id;
            document.getElementById(`check_agent_${resourceId}`).checked = true;
            document.querySelector(`[data-resource-id="${resourceId}"]`).classList.add('selected');
            selectedAgents.add(resourceId);
            const resource = agentResources.find(r => r.id === resourceId);
            const resourceKey = `agent_${resourceId}`;
            const resourceName = `🤖 ${resource.name}`;
            selectedResources.add(resourceKey);
            resourceNameMap.set(resourceKey, resourceName);
        }
    });

    updateSelectedCount();
    updateShareButton();
    updateSelectedResourcesInput();
}

function updateSelectedResourcesInput() {
    const selectedResourcesInput = document.getElementById('selectedResources');
    const selectedNames = Array.from(selectedResources).map(resourceKey => resourceNameMap.get(resourceKey));
    selectedResourcesInput.value = selectedNames.join(', ');
}

//--fetch user ------------------------------------------------



// Fetch connection resources
async function fetchConnectionResources() {
  try {
    const response = await fetch('/admin/api/connection-resources');
    const data = await response.json();
    connectionResources = data.data;
    renderConnectionResources();
    allResources = [...connectionResources, ...agentResources];
    updateSelectedCount();
    updateShareButton();
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
    updateSelectedCount();
    updateShareButton();
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

//Render agent resources grid
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
function handleResourceClick(type, resourceId, event) {
    // Don't toggle if clicking on checkbox directly
    if (event.target.type === 'checkbox') {
        return;
    }
    
    const checkbox = document.getElementById(`check_${type}_${resourceId}`);
    checkbox.checked = !checkbox.checked;
    toggleResourceSelection(type, resourceId);
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


// function updateSelectedResourcesInput() {
//     const selectedResourcesInput = document.getElementById('selectedResources');
//     const selectedResourcesArray = Array.from(selectedResources);
//     selectedResourcesInput.value = selectedResourcesArray.join(', ');
// }


// Clear connection selections
// function clearConnectionSelections() {
//     selectedConnections.clear();
    
//     document.querySelectorAll('#connectionsGrid .resource-item').forEach(item => {
//         item.classList.remove('selected');
//     });
//     document.querySelectorAll('#connectionsGrid .checkbox').forEach(checkbox => {
//         checkbox.checked = false;
//     });
    
//     updateSelectedCount();
//     updateShareButton();
// }

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
// function clearAgentSelections() {
//     selectedAgents.clear();
    
//     document.querySelectorAll('#agentsGrid .resource-item').forEach(item => {
//         item.classList.remove('selected');
//     });
//     document.querySelectorAll('#agentsGrid .checkbox').forEach(checkbox => {
//         checkbox.checked = false;
//     });
    
//     updateSelectedCount();
//     updateShareButton();
// }

function clearConnectionSelections() {
    selectedConnections.clear();
    
    for (let resource of selectedResources) {
        if (resource.startsWith('connection_')) {
            selectedResources.delete(resource);
        }
    }
    
    for (let [key, value] of resourceNameMap) {
        if (key.startsWith('connection_')) {
            resourceNameMap.delete(key);
        }
    }
    
    document.querySelectorAll('#connectionsGrid .resource-item').forEach(item => {
        item.classList.remove('selected');
    });
    document.querySelectorAll('#connectionsGrid .checkbox').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    updateSelectedCount();
    updateShareButton();
    updateSelectedResourcesInput();
}

function clearAgentSelections() {
    selectedAgents.clear();
    
    for (let resource of selectedResources) {
        if (resource.startsWith('agent_')) {
            selectedResources.delete(resource);
        }
    }
    
    for (let [key, value] of resourceNameMap) {
        if (key.startsWith('agent_')) {
            resourceNameMap.delete(key);
        }
    }
    
    document.querySelectorAll('#agentsGrid .resource-item').forEach(item => {
        item.classList.remove('selected');
    });
    document.querySelectorAll('#agentsGrid .checkbox').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    updateSelectedCount();
    updateShareButton();
    updateSelectedResourcesInput();
}
// // Toggle resource selection
// function toggleResourceSelection(type, resourceId, event) {
//     // Prevent event bubbling if called from checkbox
//     if (event && event.target && event.target.type === 'checkbox') {
//         event.stopPropagation();
//     }
    
//     let checkboxId;
//     if (type === 'connection') {
//         checkboxId = `check_conn_${resourceId}`;
//     } else if (type === 'agent') {
//         checkboxId = `check_agent_${resourceId}`;
//     }
    
//     const checkbox = document.getElementById(checkboxId);
    
//     if (!checkbox) {
//         console.error(`Checkbox not found for ${checkboxId}`);
//         return;
//     }
    
//     const resourceItem = checkbox.closest('.resource-item');
//     const resourceKey = `${type}_${resourceId}`;
//     const resourceNameElement = resourceItem.querySelector('.resource-title');
//     const resourceName = resourceNameElement.textContent.trim();
    
//     let prefix;
//     if (type === 'connection') {
//         prefix = '🔗 ';
//     } else {
//         prefix = '🤖 ';
//     }
    
//     if (checkbox.checked) {
//         resourceItem.classList.add('selected');
//         console.log("resourceKey- checked",resourceKey)
//         selectedResources.add(resourceKey);
//         if (type === 'connection') {
//             selectedConnections.add(resourceId);
//         } else {
//             selectedAgents.add(resourceId);
//         }
//     } else {
//         resourceItem.classList.remove('selected');
//         selectedResources.delete(resourceKey);
//         console.log("resourceKey- remove",resourceKey)
//         if (type === 'connection') {
//             selectedConnections.delete(resourceId);
//         } else {
//             selectedAgents.delete(resourceId);
//         }
//     }

//     updateSelectedCount();
//     updateShareButton();
    
    
//     // const selectedResourcesInput = document.getElementById('selectedResources');
//     // const selectedNames = [];
    
//     // // Add selected connection names
//     // Array.from(selectedConnections).forEach(id => {
//     //     const resourceItem = document.querySelector(`.resource-item[data-resource-id="${id}"]`);
//     //     const resourceNameElement = resourceItem.querySelector('.resource-title');
//     //     selectedNames.push(`🔗 ${resourceNameElement.textContent.trim()}`);
//     // });
    
//     // // Add selected agent names
//     // Array.from(selectedAgents).forEach(id => {
//     //     const resourceItem = document.querySelector(`.resource-item[data-resource-id="${id}"]`);
//     //     const resourceNameElement = resourceItem.querySelector('.resource-title');
//     //     selectedNames.push(`🤖 ${resourceNameElement.textContent.trim()}`);
//     // });
    
//     // selectedResourcesInput.value = selectedNames.join(', ');
//     const selectedResourcesInput = document.getElementById('selectedResources');
//     console.log("selectedResourcesInput",selectedResourcesInput);
//     //const selectedNames = new Set();

//     // // Add selected connection names
//     // Array.from(selectedConnections).forEach(id => {
//     //     const resourceItem = document.querySelector(`.resource-item[data-resource-id="${id}"]`);
//     //     if (resourceItem) {
//     //         const resourceNameElement = resourceItem.querySelector('.resource-title');
//     //         if (resourceNameElement) {
//     //             selectedNames.add(`🔗 ${resourceNameElement.textContent.trim()}`);
//     //         }
//     //     }
//     // });

//     // // Add selected agent names
//     // Array.from(selectedAgents).forEach(id => {
//     //     const resourceItem = document.querySelector(`.resource-item[data-resource-id="${id}"]`);
//     //     if (resourceItem) {
//     //         const resourceNameElement = resourceItem.querySelector('.resource-title');
//     //         if (resourceNameElement) {
//     //             selectedNames.add(`🤖 ${resourceNameElement.textContent.trim()}`);
//     //         }
//     //     }
//     // });

//     const currentValue = selectedResourcesInput.value.split(', ');
//     const selectedNames = new Set(currentValue);
//     console.log("initiasl",currentValue)
//     Array.from(selectedResources).forEach(resourceKey => {
//         const [type, id] = resourceKey.split('_');
//         const resourceItem = document.querySelector(`.resource-item[data-resource-id="${id}"]`);
//         if (resourceItem) {
//             const resourceNameElement = resourceItem.querySelector('.resource-title');
//             if (resourceNameElement) {
//                 if (type === 'connection') {
//                     selectedNames.add(`🔗 ${resourceNameElement.textContent.trim()}`);
//                 } else if (type === 'agent') {
//                     selectedNames.add(`🤖 ${resourceNameElement.textContent.trim()}`);
//                 }
//             }
//         }
//     });

//     Array.from(selectedNames).forEach(name => {
//         if (!Array.from(selectedResources).some(resourceKey => {
//             const resourceItem = document.querySelector(`.resource-item[data-resource-id="${resourceKey.split('_')[1]}"]`);
//             const resourceNameElement = resourceItem.querySelector('.resource-title');
//             return resourceNameElement && resourceNameElement.textContent.trim() === name.replace(/^(🔗|🤖) /, '');
//         })) {
//             selectedNames.delete(name);
//         }
//     });



//     console.log("selectedNames",selectedNames); 
//     selectedResourcesInput.value = Array.from(selectedNames).join(', ');

    
    
// }

// function toggleResourceSelection(type, resourceId, event) {
//     // Prevent event bubbling if called from checkbox
//     if (event && event.target && event.target.type === 'checkbox') {
//         event.stopPropagation();
//     }
    
//     let checkboxId;
//     if (type === 'connection') {
//         checkboxId = `check_conn_${resourceId}`;
//     } else if (type === 'agent') {
//         checkboxId = `check_agent_${resourceId}`;
//     }
    
//     const checkbox = document.getElementById(checkboxId);
    
//     if (!checkbox) {
//         console.error(`Checkbox not found for ${checkboxId}`);
//         return;
//     }
    
//     const resourceItem = checkbox.closest('.resource-item');
//     const resourceKey = `${type}_${resourceId}`;
//     const resourceNameElement = resourceItem.querySelector('.resource-title');
//     const resourceName = resourceNameElement.textContent.trim();
    
//     let prefix;
//     if (type === 'connection') {
//         prefix = '🔗 ';
//     } else {
//         prefix = '🤖 ';
//     }
    
//     if (checkbox.checked) {
//         resourceItem.classList.add('selected');
//         selectedResources.add(resourceKey);
//         resourceNameMap.set(resourceKey, prefix + resourceName);
//         if (type === 'connection') {
//             selectedConnections.add(resourceId);
//         } else {
//             selectedAgents.add(resourceId);
//         }
//     } else {
//         resourceItem.classList.remove('selected');
//         selectedResources.delete(resourceKey);
//         resourceNameMap.delete(resourceKey);
//         if (type === 'connection') {
//             selectedConnections = new Set([...selectedConnections].filter(id => id !== resourceId));
//         } else {
//             selectedAgents = new Set([...selectedAgents].filter(id => id !== resourceId));
//         }
//     }

//     updateSelectedCount();
//     updateShareButton();
//     updateSelectedResourcesInput();
   
// }

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
    
    if (checkbox.checked) {
        resourceItem.classList.add('selected');
        selectedResources.add(resourceKey);
        resourceNameMap.set(resourceKey, prefix + resourceName);
        if (type === 'connection') {
            selectedConnections.add(Number(resourceId));
        } else {
            selectedAgents.add(Number(resourceId));
        }
    } else {
        resourceItem.classList.remove('selected');
        selectedResources.delete(resourceKey);
        resourceNameMap.delete(resourceKey);
        if (type === 'connection') {
            selectedConnections = new Set([...selectedConnections].filter(id => id !== Number(resourceId)));
        } else {
            selectedAgents = new Set([...selectedAgents].filter(id => id !== Number(resourceId)));
        }
    }

    updateSelectedCount();
    updateShareButton();
    updateSelectedResourcesInput();
}


// Update selected count display
// function updateSelectedCount() {
//     const connectionCount = selectedConnections.size;
//     const agentCount = selectedAgents.size;
//     const totalCount = connectionCount + agentCount;
    
//     document.getElementById('selectedCount').textContent = `(${totalCount})`;
    
//     const sselectedNames = [];
//     // Add selected connection names
//     Array.from(selectedConnections).forEach(id => {
//         const resource = connectionResources.find(r => r.id === id);
//         if (resource) sselectedNames.push(`🔗 ${resource.name}`);
//     });
    
//     // Add selected agent names
//     Array.from(selectedAgents).forEach(id => {
//         const resource = agentResources.find(r => r.id === id);
//         if (resource) sselectedNames.push(`🤖 ${resource.name}`);
//     });
    
//     document.getElementById('selectedResources').value = sselectedNames.join(', ');
//     const removeBtn = document.getElementById('removeBtn');
//     removeBtn.disabled = selectedConnections.size === 0 && selectedAgents.size === 0;
// }

function updateSelectedCount() {
    const connectionCount = selectedConnections.size;
    const agentCount = selectedAgents.size;
    const totalCount = connectionCount + agentCount;
    
    document.getElementById('selectedCount').textContent = `(${totalCount})`;
    
    const sselectedNames = [];
    // Add selected connection names
    Array.from(selectedConnections).forEach(id => {
        const resource = connectionResources.find(r => r.id === Number(id));
        if (resource) sselectedNames.push(`🔗 ${resource.name}`);
    });
    
    // Add selected agent names
    Array.from(selectedAgents).forEach(id => {
        const resource = agentResources.find(r => r.id === Number(id));
        if (resource) sselectedNames.push(`🤖 ${resource.name}`);
    });
    
    document.getElementById('selectedResources').value = sselectedNames.join(', ');
    const removeBtn = document.getElementById('removeBtn');
    removeBtn.disabled = selectedConnections.size === 0 && selectedAgents.size === 0;
}



function showNotification(message, type = 'success') {
            const notification = document.createElement('div');
            notification.className = `notification ${type === 'error' ? 'error' : ''}`;
            notification.textContent = message;
            
            document.body.appendChild(notification);
            
            // Show notification
            setTimeout(() => {
                notification.classList.add('show');
            }, 100);
            
            // Hide notification after 3 seconds
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => {
                    if (notification.parentNode) {
                        document.body.removeChild(notification);
                    }
                }, 300);
            }, 3000);
        }

async function removeResources() {
    const selectedUser = document.getElementById('userSelect').value;
    
    if (!selectedUser) {
        showNotification('Please select a user', 'error');
        return;
    }

    //const resourceIds = [...selectedConnections, ...selectedAgents];
    const resourceIds = Array.from(selectedResources);
    
    if (resourceIds.length === 0) {
        showNotification('Please select at least one resource', 'error');
        return;
    }

    console.log("selectedUser",selectedUser)
    console.log("resourceIds",resourceIds)
    try {
        const response = await fetch('/admin/api/remove-resources', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: selectedUser,
                resource_ids: resourceIds
            })
        });

        const data = await response.json();

        if (data.success) {
            showNotification('Resources removed successfully');
            // Update local data and UI
            selectedConnections.clear();
            selectedAgents.clear();
            updateSelectedCount();
            fetchUsers();
            renderConnectionResources();
            renderAgentResources();

        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        console.error('Error removing resources:', error);
        showNotification('Failed to remove resources', 'error');
    }
}

// Share resources with selected user
// async function shareResources() {
//     const selectedUser = document.getElementById('userSelect').value;
//     const resourceIds = Array.from(selectedResources);
    
//     if (!selectedUser || resourceIds.length === 0) {
//         showNotification('Please select a user and at least one resource', 'error');
//         return;
//     }

//     // Show loading state
//     const shareBtn = document.getElementById('shareBtn');
//     const originalText = shareBtn.textContent;
//     shareBtn.textContent = 'Sharing...';
//     shareBtn.disabled = true;
//     document.body.classList.add('loading');
//     console.log("selectedUser",selectedUser)
//     console.log("resourceIds",resourceIds)

//     try {
//         // Simulate API call
//         const response = await simulateAPICall('/api/share', {
//             method: 'POST',
//             body: JSON.stringify({
//                 user_id: selectedUser,
//                 resource_ids: resourceIds,
//                 shared_by: 'admin'
//             })
//         });

//         if (response.success) {
//             // Update local data
//             resourceIds.forEach(resourceId => {
//                 const resource = allResources.find(r => r.id === resourceId);
//                 if (resource && !resource.shared_with.includes(selectedUser)) {
//                     resource.shared_with.push(selectedUser);
//                 }
//             });

//             // Reset form
//             selectedResources.clear();
//             document.getElementById('userSelect').value = '';
//             document.getElementById('selectedResources').value = '';
            
//             // Clear all selections
//             document.querySelectorAll('.resource-item').forEach(item => {
//                 item.classList.remove('selected');
//             });
//             document.querySelectorAll('.checkbox').forEach(checkbox => {
//                 checkbox.checked = false;
//             });
            
//             updateSelectedCount();
//             updateShareButton();
            
//             const userName = users.find(u => u.id === selectedUser)?.name || selectedUser;
//             showNotification(`Successfully shared ${resourceIds.length} resource(s) with ${userName}`, 'success');
//         } else {
//             throw new Error(response.message || 'Sharing failed');
//         }
//     } catch (error) {
//         console.error('Error sharing resources:', error);
//         showNotification('Failed to share resources. Please try again.', 'error');
//     } finally {
//         // Reset loading state
//         shareBtn.textContent = originalText;
//         shareBtn.disabled = false;
//         document.body.classList.remove('loading');
//         updateShareButton();
//     }
// }

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
    console.log("selectedUser",selectedUser)
    console.log("resourceIds",resourceIds)

    try {
        const response = await fetch('/admin/api/share', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: selectedUser,
                resource_ids: resourceIds.map(resource => {
                    const [type, id] = resource.split('_');
                    return { type, id };
                })
            })
        });

        if (response.ok) {
            const data = await response.json();
            // Update local data
            resourceIds.forEach(resourceId => {
                const [type, id] = resourceId.split('_');
                if (type === 'connection') {
                    const resource = connectionResources.find(r => r.id === id);
                    if (resource && !resource.shared_with.includes(selectedUser)) {
                        resource.shared_with.push(selectedUser);
                    }
                } else {
                    const resource = agentResources.find(r => r.id === id);
                    if (resource && !resource.shared_with.includes(selectedUser)) {
                        resource.shared_with.push(selectedUser);
                    }
                }
            });

            // Reset form
            selectedResources.clear();
            selectedConnections.clear();
            selectedAgents.clear();
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
            fetchUsers();
            fetchConnectionResources();
            fetchAgentResources();
        } else {
            throw new Error('Sharing failed');
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



async function addnewuserresource() {
    
    const emailInput = document.getElementById('addnewuserresources');
    const email = emailInput.value.trim();

    if (!email) {
        showNotification('Please enter an email address', 'error');
        return;
    }

    const resourceIds = Array.from(selectedResources);
    
    if (resourceIds.length === 0) {
        showNotification('Please select at least one resource', 'error');
        return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
        //alert('Please enter a valid email address');
        showNotification('Please enter a valid email address', 'error');
        return;
    }

    const button = document.getElementById('addBtn');
    const buttonText = document.getElementById('button-text');
    const loadingAnimation = document.getElementById('loading-animation');

    buttonText.style.display = 'none';
    loadingAnimation.style.display = 'flex';

    try {
        const response = await fetch('/admin/api/invite', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: email,  resource_ids: resourceIds })
        });
        const data = await response.json();

        if (data.message) {
            buttonText.style.display = 'inline-block';
            loadingAnimation.style.display = 'none';
            //alert(data.message);
            showNotification(data.message, 'success');
            emailInput.value = '';
            selectedResources.clear();
            selectedConnections.clear();
            selectedAgents.clear();
            document.getElementById('userSelect').value = '';
            document.getElementById('selectedResources').value = '';

             document.querySelectorAll('.resource-item').forEach(item => {
                item.classList.remove('selected');
            });
            document.querySelectorAll('.checkbox').forEach(checkbox => {
                checkbox.checked = false;
            });

            updateSelectedCount();
            updateShareButton();
            
            fetchUsers();
            fetchConnectionResources();
            fetchAgentResources();


        } else {
            buttonText.style.display = 'inline-block';
            loadingAnimation.style.display = 'none';
            alert(data.error);
        }
    } catch (error) {
        console.error(error);
        buttonText.style.display = 'inline-block';
        loadingAnimation.style.display = 'none';
        alert('Error sending invite');
    }
}



setupEventListeners();

window.addEventListener('load', function() {
    clearConnectionSelections();
    clearAgentSelections(); // If you have a similar function for agents
});