document.addEventListener("DOMContentLoaded", () => {
        // Get all db-tile elements
    console.log("Dome entered")
    const dbTiles = document.querySelectorAll('.col-md-3 .card');

    // Get the continue button
    //const continueButton = document.querySelector(".btn btn-primary me-2"); // Replace with your actual button ID
    const continueButton = document.getElementById("db-continue-button");
    console.log("Dome entered",continueButton)
    // Variable to store the selected db-tile
    let selectedDbTile = null;

    // Add event listener to each db-tile
    dbTiles.forEach((tile) => {
    tile.addEventListener('click', () => {
        // Remove selected class from all db-tiles
        dbTiles.forEach((t) => t.classList.remove('selected'));

        // Add selected class to the clicked db-tile
        tile.classList.add('selected');

        // Update the selected db-tile variable
        selectedDbTile = tile;
    });
    });

    const exitButton = document.querySelector(".exit-btn");
  
    if (exitButton) {
      exitButton.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = "/databases";
      });
    }



    // Add event listener to the continue button
    continueButton.addEventListener('click', (e) => {
    if (!selectedDbTile) {
        e.preventDefault(); // Prevent default button behavior
        alert('Please select a database');
    } else {
        // Continue with your logic here
        console.log('Selected database:', selectedDbTile.textContent.trim());
        const url = `/connection_form?database=${encodeURIComponent(selectedDbTile.textContent.trim())}`;
        window.location.href = url;
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