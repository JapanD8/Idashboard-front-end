document.addEventListener("DOMContentLoaded", () => {
    //const demail = {{email}};
    const userIcon = document.getElementById("user-icon");
    const userModal = document.getElementById("user-modal");
    const userEmail = document.getElementById("user-email");
    const email = userIcon.dataset.email || "";
    // (email && typeof email === "string") {
    //userIcon.textContent = email.charAt(0).toUpperCase();
    console.log("email",email)
   
    const serEmail = userEmail.textContent;
    console.log("serEmail",serEmail)
    const existingEmail = localStorage.getItem('email');
    if (!existingEmail) {
      localStorage.setItem('email', serEmail);
    }

    //
    const sesionemail = localStorage.getItem('email');
    console.log("sesionemail",sesionemail)
    if (sesionemail) {
      userIcon.textContent = sesionemail.charAt(0).toUpperCase();
      userEmail.textContent = sesionemail;
    }
   
    if (serEmail && typeof serEmail === 'string') {
        userIcon.textContent = serEmail.charAt(0).toUpperCase();
        userEmail.textContent = serEmail;
      }

    userIcon.addEventListener("click", () => {
      userModal.classList.toggle("show");
    });

    console.log("logoutButton",logoutButton)

    userIcon.addEventListener('click', () => {
      userModal.style.display = userModal.style.display === 'block' ? 'none' : 'block';
    });

    window.addEventListener('click', (event) => {
      if (!userModal.contains(event.target) && event.target !== userIcon) {
        userModal.style.display = 'none';
      }
    });
    
    // Prevent modal from closing when clicking inside
    userModal.addEventListener('click', (event) => {
      event.stopPropagation();
    });
    const logoutButton = document.querySelector('.dropdown-menu .dropdown-item:nth-child(2)');
    // Logout functionality
    logoutButton.addEventListener('click', () => {
      sessionStorage.clear();
      localStorage.clear();
      window.location.href = '/login'; // redirect to login page
    });

  });


