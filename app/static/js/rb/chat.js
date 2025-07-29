let dataLoaded = false;
let domLoaded = false;
const urlParams = new URLSearchParams(window.location.search);
const path = window.location.pathname;
const chatId = path.split('/').pop();
console.log("chatId",chatId)
localStorage.setItem('chatId', chatId)
let mockData;
 
const navigationEntries = performance.getEntriesByType("navigation");
if (navigationEntries.length > 0 && navigationEntries[0].type === "reload") {
  console.log("Page Reloaded");
} else {
  console.log("Page Loaded (Not Reloaded)");
}

fetchSchemaById(chatId);


function fetchSchemaById(id) {
    fetch(`/rb/getfiles/${id}`)
    .then(response => response.json())
    .then(data => {
        const container = document.getElementById('checkboxContainer');
        container.innerHTML = '';
    console.log("111111",data)
    const mockData =data.data
    mockData.forEach((item, index) => {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `file-${index}`;
      checkbox.setAttribute('data-sid', item.id);
      checkbox.checked = true;

      const label = document.createElement('label');
      label.textContent = item.original_name;
      label.htmlFor = `file-${index}`;
      label.id = item.id;
      label.style.marginLeft = '5px';

      container.appendChild(checkbox);
      container.appendChild(label);
      container.appendChild(document.createElement('br'));
    });
  })
  .catch(error => console.error('Error loading mock data:', error));
  }


//   const searchInput = document.getElementById('inlineFormInputGroup');

//   searchInput.addEventListener('input', function() {
//     const searchTerm = searchInput.value.toLowerCase();
//     const checkboxes = document.querySelectorAll('#checkboxContainer label');
  
//     checkboxes.forEach(function(label) {
//       const filename = label.textContent.toLowerCase();
//       if (filename.includes(searchTerm)) {
//         label.parentNode.style.display = '';
//       } else {
//         label.parentNode.style.display = 'none';
//       }
//     });
//   });


  const searchInput = document.getElementById('inlineFormInputGroup');

  searchInput.addEventListener('input', function() {
    const searchTerm = searchInput.value.toLowerCase();
    const checkboxContainers = document.querySelectorAll('#checkboxContainer > input, #checkboxContainer > label, #checkboxContainer > br').forEach((element, index) => {
      if (element.tagName === 'LABEL') {
        const filename = element.textContent.toLowerCase();
        if (filename.includes(searchTerm) || searchTerm === '') {
          element.style.display = '';
          element.previousElementSibling.style.display = '';
          if(element.nextElementSibling.tagName === 'BR'){
            element.nextElementSibling.style.display = '';
          }
        } else {
          element.style.display = 'none';
          element.previousElementSibling.style.display = 'none';
          if(element.nextElementSibling.tagName === 'BR'){
            element.nextElementSibling.style.display = 'none';
          }
        }
      }
    });
  });