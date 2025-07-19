document.addEventListener("DOMContentLoaded", () => {
    const continueButton = document.getElementById("db-submit-button");
    console.log("Dome entered",continueButton)
    const urlParams = new URLSearchParams(window.location.search);
    const databaseName = urlParams.get('database');
    const databaseName2 = decodeURIComponent(urlParams.get('database'));
    document.getElementById('database-name').innerHTML = `Add your ${databaseName}`;

   


    const backButton = document.getElementById("exit-btn");
  
    if (backButton) {
        backButton.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = "/dashboard";
      });
    }

    continueButton.addEventListener('click', (e) => {
        e.preventDefault();
        console.log("Button clicked")
        const nameInput = document.getElementById('name');
        const name = nameInput.value.trim();
        const hostInput = document.getElementById('host');
        const host = hostInput.value.trim();
        const databaseInput = document.getElementById('database'); // assuming id is 'database', not 'dbname'
        const database = databaseInput.value.trim();
        const userInput = document.getElementById('user');
        const user = userInput.value.trim();
        const passwordInput = document.getElementById('password');
        const password = passwordInput.value.trim();
        const portInput = document.getElementById('port');
        const port = portInput.value.trim();

        let isValid = true;

        if (name === '') {
            nameInput.nextElementSibling.innerHTML = 'Name is required';
            isValid = false;
        } else {
            nameInput.nextElementSibling.innerHTML = '';
        }

        if (host === '') {
            hostInput.nextElementSibling.innerHTML = 'Host is required';
            isValid = false;
        } else {
            hostInput.nextElementSibling.innerHTML = '';
        }

        if (database === '') {
            databaseInput.nextElementSibling.innerHTML = 'Database is required';
            isValid = false;
        } else {
            databaseInput.nextElementSibling.innerHTML = '';
        }

        // do the same for user, password, and port
        if (user === '') {
            userInput.nextElementSibling.innerHTML = 'User is required';
            isValid = false;
        } else {
            userInput.nextElementSibling.innerHTML = '';
        }

        if (password === '') {
            // you might not want to require password, depending on your use case
            passwordInput.nextElementSibling.innerHTML = 'Password is required';
            isValid = false;
        } else {
            passwordInput.nextElementSibling.innerHTML = '';
        }

        if (port === '') {
            portInput.nextElementSibling.innerHTML = 'Port is required';
            isValid = false;
        } else {
            portInput.nextElementSibling.innerHTML = '';
        }
        if (isValid) {
            // Form is valid, submit it or perform further actions
            console.log('Form is valid');
            // You can add your form submission logic here
        }

        if (isValid) {
            const data = {
                name: name,
                host: host,
                database: database,
                user: user,
                password: password,
                port: port,
                db_system : databaseName2
            };
        
            fetch('/save_connection', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
            .then(response => {
                if (response.status === 200) {
                    window.location.href = '/dashboard'; // Redirect to another page
                } else {
                    console.error('Error:', response.status);
                }
            })
            .catch(error => console.error('Error:', error));
        }


        });


    const logoutButton = document.querySelector('.dropdown-menu .dropdown-item:nth-child(2)');
    // Logout functionality
    logoutButton.addEventListener('click', () => {
      sessionStorage.clear();
      localStorage.clear();
      window.location.href = '/login'; // redirect to login page
    });
});