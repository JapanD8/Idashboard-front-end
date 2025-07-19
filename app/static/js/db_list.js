console.log('JavaScript is loaded'); // Add this line to verify the script is loaded

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM is fully loaded'); // Add this line to verify the DOM is loaded
    //initBackground();
    // Only auto-run if not suppressed
 
    const connectionsContainer = document.getElementById('connections-data');
    const connections = connectionsContainer.getAttribute('data-connections');
    console.log(connections);
    console.log(typeof connections);

    const deleteIcons = document.querySelectorAll('.text-success.btn.btn-link.px-1.delete-connection');
    const editIcons = document.querySelectorAll('.text-success.btn.btn-link.px-1.edit-connection');

    console.log("deleteIcons",deleteIcons); // Log the NodeList to verify it's correct
    console.log("editIcons",editIcons)

    const confirmModal = document.getElementById('confirmModal');
    const editModal = document.getElementById('edit-modal');
    const closeBtn = document.querySelector('.close');
    const cancelBtn = document.getElementById('cancelDeleteBtn');
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    let currentConnectionId = null;

    // Function to open the modal
    function openModal(connectionId) {
        currentConnectionId = connectionId;
        confirmModal.style.display = 'block';
        console.log('Modal opened for connection ID:', connectionId); // Log that the modal is opened
    }

    // Function to close the modal
    function closeModal() {
        currentConnectionId = null;
        confirmModal.style.display = 'none';
        console.log('Modal closed'); // Log that the modal is closed
    
    }
    function editcloseModal() {
        currentConnectionId = null;
        editModal.style.display = 'none';
        console.log('Modal closed'); // Log that the modal is closed
    
    }

    // document.addEventListener('click', function(event) {
    //     const modal = document.getElementById('edit-modal');
    //     if (event.target.closest('.modal-dialog') === null && modal.contains(event.target) === false && modal.classList.contains('show')) {
    //       const modalInstance = bootstrap.Modal.getInstance(modal);
    //       modalInstance.hide();
    //     }
    //   });


    // Edit Icon operation

    const exitButton = document.querySelector(".exit-btn");
  
    if (exitButton) {
      exitButton.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = "/databases";
      });
    }

    editIcons.forEach(icon => {
        icon.addEventListener('click', function(event) {
          event.stopPropagation(); // Prevent any parent event handlers from being triggered
          const connectionId = this.getAttribute('data-connection-id');
          console.log('Edit icon clicked with connection ID:', connectionId); // Log the connection ID
      
          // Make a GET request to fetch the connection data
          fetch(`/api/connections/${connectionId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          })
          .then(response => response.json())
          .then(data => {
            if (data) {
              // Set the values to the edit modal
              console.log(data)
              document.getElementById('name').value = data.data.name;
              document.getElementById('host').value = data.data.host;
              document.getElementById('database').value = data.data.dbname;
              document.getElementById('user').value = data.data.user;
              document.getElementById('password').value = data.data.password;
              document.getElementById('port').value = data.data.port;
              document.getElementById('edit-modal').setAttribute('data-connection-id', connectionId);
              // Show the modal
              const modal = new bootstrap.Modal(document.getElementById('edit-modal'));
              modal.show();
            } else {
              console.error('No connection data found for ID:', connectionId);
            }
          })
          .catch(error => console.error('Error fetching connection data:', error));
        });
      });
          
          
      // Inside modal update button
      document.getElementById('db-update-button').addEventListener('click', function() {
        const connectionId = document.getElementById('edit-modal').getAttribute('data-connection-id');
        const data = {
          name: document.getElementById('name').value,
          dbname: document.getElementById('database').value,
          user: document.getElementById('user').value,
          password: document.getElementById('password').value,
          host: document.getElementById('host').value,
          port: document.getElementById('port').value
        };
      
        fetch(`/api/connections/${connectionId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            alert('Connection updated successfully!');
            const modal = bootstrap.Modal.getInstance(document.getElementById('edit-modal'));
            modal.hide();
            window.location.href = "/databases";
            // Close the modal or redirect to another page
          } else {
            console.error('Error updating connection:', data.error);
          }
        })
        .catch(error => console.error('Error updating connection:', error));
      });


    // Event listener for delete icons
    
    console.log('Number of delete icons found:', deleteIcons.length);

    deleteIcons.forEach(icon => {
        console.log('Attaching event listener to:', icon);
        icon.addEventListener('click', function(event) {
            event.stopPropagation(); 
            const connectionId = this.getAttribute('data-connection-id');
            console.log('Delete icon clicked with connection ID:', connectionId); 
            openModal(connectionId);
        });
    })

    // Event listener for close button
    closeBtn.addEventListener('click', closeModal);

    // Event listener for cancel button
    cancelBtn.addEventListener('click', closeModal);


    // Event listener for confirm button
    confirmBtn.addEventListener('click', function() {
        if (currentConnectionId) {
            console.log('Confirm delete clicked for connection ID:', currentConnectionId); // Log the connection ID
            fetch(`/connections/${currentConnectionId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log('Connection deleted successfully:', data); // Log success message
                    // Remove the card from the DOM
                    const card = document.getElementById(`card-${currentConnectionId}`);
                    if (card) {
                        card.remove();
                    }
                    closeModal();
                    // Reload the page after successful deletion
                    location.reload();
                } else {
                    console.error('Failed to delete connection:', data.error); // Log error message
                    alert('Failed to delete connection: ' + data.error);
                    closeModal();
                }
            })
            .catch(error => {
                console.error('Error:', error); // Log any errors
                alert('An error occurred while deleting the connection.');
                closeModal();
            });
        }
    });


    //chat button
    const chatButtons = document.querySelectorAll('.btn.btn-inverse-dark.btn-fw.chat-btn');
    console.log(chatButtons); 

    chatButtons.forEach(button => {
        button.addEventListener("click", function(){
          console.log("Chat button clicked!");
          const chatId = button.getAttribute("data-connection-id");
          const savedStatus = sessionStorage.getItem(`conn_status_${chatId}`);
          console.log("connectButton",chatId,savedStatus);


          if (savedStatus === 'connected') {
            window.location.href =  `/chat/${chatId}`;
          }
          else
          {
            alert('Please connect to the database first');
          }
          
        
          //
        });
      });

    // const chatButtons = document.querySelectorAll('.chat-btn');

    document.querySelectorAll('.btn.btn-inverse-success.btn-fw.connect-btn.pushme2').forEach(button => {
        const connectionId = button.getAttribute('data-connection-id');
        const savedStatus = sessionStorage.getItem(`conn_status_${connectionId}`);
        const label = document.getElementById(`label-${connectionId}`);
        const colorname = label?.getAttribute('data-name') || '';
        console.log("connectionId,savedStatus,label, colorname",connectionId,"-",savedStatus,"-",label,"-", colorname)
        if (savedStatus === 'connected') {
            button.textContent = 'Disconnect';
            button.setAttribute('data-status', 'connected');
            //button.style.backgroundColor = '#dc3545'; // red
            if (label) label.textContent = `🟢 ${colorname}`;
        } else if (savedStatus === 'disconnected') {
            button.textContent = 'Connect';
            button.setAttribute('data-status', 'disconnected');
            //button.style.backgroundColor = '#406c99 !important'; // green
            if (label) label.textContent = `🔴 ${colorname}`;
        }
    });

    
    // Event listener for connect/disconnect buttons
    const connectButtons = document.querySelectorAll('.btn.btn-inverse-success.btn-fw.connect-btn.pushme2');

    connectButtons.forEach(button => {
    button.addEventListener('click', function () {
        const connectionId = this.getAttribute('data-connection-id');
        const status = this.getAttribute('data-status');
        const label = document.getElementById(`label-${connectionId}`);
        console.log(label,connectionId)
        const colorname = label.getAttribute('data-name');

        if (!status) {
            console.error('data-status attribute is missing or null');
            return;
        }

        const method = status === 'connected' ? 'DELETE' : 'POST';
        const url = `/connections/${connectionId}/${method === 'POST' ? 'post' : 'delete'}`;

        function capitalize(str) {
            return str.charAt(0).toUpperCase() + str.slice(1);
        }

        console.log(`${capitalize(status)} button clicked for connection ID: ${connectionId}`);

        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log(`${capitalize(status)} successful for connection ID: ${connectionId}`, data);

                // 🔁 Toggle connection status
                if (status === 'connected') {
                    this.textContent = 'Connect';
                    this.setAttribute('data-status', 'disconnected');

                    // ✅ Save state in sessionStorage
                    sessionStorage.setItem(`conn_status_${connectionId}`, 'disconnected');

                    if (label) {
                        label.textContent = `🔴 ${colorname}`;
                    }
                } else {
                    this.textContent = 'Disconnect';
                    this.setAttribute('data-status', 'connected');

                    // ✅ Save state in sessionStorage
                    sessionStorage.setItem(`conn_status_${connectionId}`, 'connected');

                    if (label) {
                        label.textContent = `🟢 ${colorname}`;
                    }
                }
            } else {
                console.error(`${capitalize(status)} failed for connection ID: ${connectionId}`, data.error);
                alert(`${capitalize(status)} failed: ` + data.error);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while ' + status + 'ing the connection.');
        });
    });
    });


    
     
    
    const getSecretLabels = document.querySelectorAll('.btn.btn-link.btn-fw.get-secret-btn');

    getSecretLabels.forEach(label => {
      label.addEventListener('click', function(event) {
        event.stopPropagation(); // Prevent any parent event handlers from being triggered
        const connectionId = this.getAttribute('data-connection-id');
        console.log('Get secret label clicked with connection ID:', connectionId); // Log the connection ID
        const user_id = localStorage.getItem("user_id")
        const secretdata = {user_id: user_id,db_id:connectionId};
        console.log(secretdata)
        // Make a GET request to fetch the secret key
        fetch(`/get_secret`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body:JSON.stringify(secretdata),
        })
        .then(response => response.json())
        .then(data => {
          if (data) {
            // Show modal with secret key and expire time
            const secretKeyModal = new bootstrap.Modal(document.getElementById('secret-key-modal'));
            secretKeyModal.show();
            document.querySelector('#secret-key-modal .modal-body').innerHTML = `Secret Key: ${data.secret_key}<br>Expires in: 30 minutes`;
          } else {
            console.log('No data received');
          }
        })
        .catch(error => console.error('Error:', error));
      });
    });

    document.querySelector('.btn-secondary').addEventListener('click', function() {
      const secretKeyModal = bootstrap.Modal.getInstance(document.getElementById('secret-key-modal'));
      if (secretKeyModal) {
        secretKeyModal.hide();
      } else {
        document.getElementById('secret-key-modal').style.display = 'none';
      }
    });
    // Close the modal if the user clicks outside of it
    window.onclick = function(event) {
        if (event.target === confirmModal) {
            closeModal();
        }
       
    };

    const logoutButton = document.querySelector('.dropdown-menu .dropdown-item:nth-child(2)');
    // Logout functionality
    logoutButton.addEventListener('click', () => {
      sessionStorage.clear();
      localStorage.clear();
      window.location.href = '/login'; // redirect to login page
    });
});