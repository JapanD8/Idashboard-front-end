// const mockData = {
//     "database": "INS_DB",
//     "tables": [
//       {
//         "name": "customers",
//         "columns": [
//           { "name": "id", "type": "int" },
//           { "name": "name", "type": "varchar" },
//           { "name": "email", "type": "varchar" },
//           { "name": "joined_date", "type": "datetime" }
//         ]
//       },
//       {
//         "name": "products", 
//         "columns": [
//           { "name": "id", "type": "int" },
//           { "name": "name", "type": "varchar" },
//           { "name": "price", "type": "decimal" },
//           { "name": "category", "type": "varchar" }
//         ]
//       },
//       {
//         "name": "orders",
//         "columns": [
//           { "name": "id", "type": "int" },
//           { "name": "customer_id", "type": "int" },
//           { "name": "product_id", "type": "int" },
//           { "name": "order_date", "type": "datetime" }
//         ]
//       },
//       {
//         "name": "orders2",
//         "columns": [
//           { "name": "id", "type": "int" },
//           { "name": "customer_id", "type": "int" },
//           { "name": "product_id", "type": "int" },
//           { "name": "order_date", "type": "datetime" }
//         ]
//       },
//       {
//         "name": "orders3",
//         "columns": [
//           { "name": "id", "type": "int" },
//           { "name": "customer_id", "type": "int" },
//           { "name": "product_id", "type": "int" },
//           { "name": "order_date", "type": "datetime" }
//         ]
//       },
//       {
//         "name": "orders4",
//         "columns": [
//           { "name": "id", "type": "int" },
//           { "name": "customer_id", "type": "int" },
//           { "name": "product_id", "type": "int" },
//           { "name": "order_date", "type": "datetime" }
//         ]
//       }
//     ]
//   };

let dataLoaded = false;
let domLoaded = false;
const urlParams = new URLSearchParams(window.location.search);
const path = window.location.pathname;
const chatId = path.split('/').pop();
console.log("chatId",chatId)
localStorage.setItem('chatId', 1)
let mockData;
 
const navigationEntries = performance.getEntriesByType("navigation");
if (navigationEntries.length > 0 && navigationEntries[0].type === "reload") {
  console.log("Page Reloaded");
} else {
  console.log("Page Loaded (Not Reloaded)");
}

fetchSchemaById(1);


function fetchSchemaById(id) {
    fetch(`/connections/${id}/schema`)
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          mockData = data.data;
          console.log('Mock data 1:', mockData);
          sessionStorage.setItem('mockdata-'+chatId, JSON.stringify(mockData));
          dataLoaded = true;
          if (domLoaded) {
            loadTreeData(mockData);
          }
        } else {
          console.error('Error fetching schema');
        }
      })
      .catch(error => console.error('Error fetching schema:', error));
  }



//const mockData = {};

let allTreeItems = [];

function createTreeItem(data, isRoot = false) {
const li = document.createElement('li');
li.className = isRoot ? 'tree-item root' : 'tree-item';

const content = document.createElement('div');
content.className = 'tree-content';

const icon = document.createElement('span');
icon.className = 'tree-icon';

const label = document.createElement('span');
label.className = 'tree-label';

if (data.type === 'database') {
    icon.classList.add('folder', 'expandable', 'expanded');
    label.textContent = data.name;
    content.appendChild(icon);
    content.appendChild(label);
    li.appendChild(content);
    
    if (data.tables && data.tables.length > 0) {
    const children = document.createElement('ul');
    children.className = 'tree-children';
    
    data.tables.forEach(table => {
        const tableItem = createTreeItem({
        type: 'table',
        name: table.name,
        columns: table.columns
        });
        children.appendChild(tableItem);
    });
    
    li.appendChild(children);
    
    content.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleNode(icon, children);
    });
    }
} else if (data.type === 'table') {
    // Add checkbox for table selection
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'table-checkbox';
    checkbox.id = `table-${data.name}`;
    
    icon.classList.add('table', 'expandable', 'collapsed');
    label.textContent = data.name;
    content.appendChild(checkbox);
    content.appendChild(icon);
    content.appendChild(label);
    li.appendChild(content);
    
    // Store reference for filtering
    li.setAttribute('data-table-name', data.name.toLowerCase());
    
    if (data.columns && data.columns.length > 0) {
    const children = document.createElement('ul');
    children.className = 'tree-children hidden';
    
    data.columns.forEach(column => {
        const columnItem = createTreeItem({
        type: 'column',
        name: column.name,
        dataType: column.type
        });
        children.appendChild(columnItem);
    });
    
    li.appendChild(children);
    
    icon.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleNode(icon, children);
    });
    }
} else if (data.type === 'column') {
    icon.classList.add('column');
    label.textContent = data.name;
    content.appendChild(icon);
    content.appendChild(label);
    
    if (data.dataType) {
    const type = document.createElement('span');
    type.className = 'tree-type';
    type.textContent = data.dataType;
    content.appendChild(type);
    }
    
    li.appendChild(content);
}

return li;
}

function toggleNode(icon, children) {
if (icon.classList.contains('expanded')) {
    icon.classList.remove('expanded');
    icon.classList.add('collapsed');
    children.classList.add('hidden');
} else {
    icon.classList.remove('collapsed');
    icon.classList.add('expanded');
    children.classList.remove('hidden');
}
}

function loadTreeData(data) {
const treeContainer = document.getElementById('treeContainer');
treeContainer.innerHTML = '';

const rootItem = createTreeItem({
    type: 'database',
    name: data.database || 'Database',
    tables: data.tables || []
}, true);

treeContainer.appendChild(rootItem);

// Store all table items for filtering
allTreeItems = Array.from(treeContainer.querySelectorAll('[data-table-name]'));

// Select all tables by default
const checkboxes = document.querySelectorAll('.table-checkbox');
checkboxes.forEach(cb => cb.checked = true);
}

function toggleAllTables(source) {
const checkboxes = document.querySelectorAll('.table-checkbox');
checkboxes.forEach(cb => cb.checked = source.checked);
}

function filterTables(searchTerm) {
const term = searchTerm.toLowerCase();

allTreeItems.forEach(item => {
    const tableName = item.getAttribute('data-table-name');
    if (tableName.includes(term)) {
    item.style.display = '';
    } else {
    item.style.display = 'none';
    }
});
}

// Initialize the tree on page load
window.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded");
 
    domLoaded = true;
    if (dataLoaded) {
      loadTreeData(mockData);
    }
  });