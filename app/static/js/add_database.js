// document.addEventListener("DOMContentLoaded", () => {
//     const add_db_button = document.getElementById("add-db-button");

//     add_db_button.addEventListener("submit", () => {
//         window.location.href = "/add-database";
//     });

//   });

document.addEventListener("DOMContentLoaded", () => {
    const addButton = document.querySelector(".add-db-button");
  
    if (addButton) {
      addButton.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = "/add-database";
      });
    }


    const logoutButton = document.getElementById('logout-button');

    logoutButton.addEventListener('click', () => {
      sessionStorage.clear();
      localStorage.clear();
      window.location.href = '/login'; // redirect to login page
    });

    
  });
  