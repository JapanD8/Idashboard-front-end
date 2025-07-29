

// document.addEventListener("DOMContentLoaded", () => {
//     const form = document.getElementById("login-form");
//     const btn = document.getElementById("login-button");
  
//     if (!form || !btn) return;
  
//     btn.addEventListener("click", async (e) => {
//       e.preventDefault();
  
//       const email = document.getElementById("email").value.trim();
//       const password = document.getElementById("password").value.trim();
  
//       // ✅ Client-side validation
//       if (!email || !password) {
//         alert("Both email and password are required.");
//         return;
//       }
  
//       const emailPattern = /^[^ ]+@[^ ]+\.[a-z]{2,3}$/;
//       if (!emailPattern.test(email)) {
//         alert("Invalid email format.");
//         return;
//       }
  
//       if (password.length < 6) {
//         alert("Password must be at least 6 characters.");
//         return;
//       }
  
//       // ✅ Send login request to Flask
//       try {
//         const response = await fetch("/login", {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({ email, password }),
//         });
  
//         const data = await response.json();
//         console.log(data)
//         if (response.ok) {
//           alert("✅ Login successful!");
//           // Redirect to dashboard or home
//           localStorage.setItem('session_id', data.session_id);
//           localStorage.setItem('user_id', data.user_id);
//           window.location.href = "/dashboard";
//         } else {
//           alert("❌ " + (data.message || "Login failed"));
//         }
//       } catch (err) {
//         console.error("Login error:", err);
//         alert("❌ Server error. Try again later.");
//       }


//     });
//   });
  
//    function togglePassword(event) {
//     event.preventDefault(); // prevent the default anchor behavior

//     const toggle = event.currentTarget;
//     const passwordInput = document.getElementById('password');
//     const iconOn = toggle.querySelector('.on');
//     const iconOff = toggle.querySelector('.off');

//     const isPasswordVisible = passwordInput.type === 'text';

//     passwordInput.type = isPasswordVisible ? 'password' : 'text';

//     // Toggle icons
//     if (isPasswordVisible) {
//       iconOn.classList.remove('d-none');
//       iconOff.classList.add('d-none');
//     } else {
//       iconOn.classList.add('d-none');
//       iconOff.classList.remove('d-none');
//     }
//   }

  

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");
  const btn = document.getElementById("login-button");

  if (!form || !btn) return;

  btn.addEventListener("click", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    // ✅ Validation
    if (!email || !password) {
      showError("Both email and password are required.");
      return;
    }

    const emailPattern = /^[^ ]+@[^ ]+\.[a-z]{2,3}$/;
    if (!emailPattern.test(email)) {
      showError("Invalid email format.");
      return;
    }

    if (password.length < 6) {
      showError("Password must be at least 6 characters.");
      return;
    }

    // ✅ Send login request
    try {
      const response = await fetch("/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // ✅ Show success alert
        const successAlert = document.getElementById("loginSuccessAlert");
        if (successAlert) {
          successAlert.style.display = "block";
        }

        // Store session
        localStorage.setItem("session_id", data.session_id);
        localStorage.setItem("user_id", data.user_id);

        // Redirect after 3s
        setTimeout(() => {
          if (successAlert) successAlert.style.display = "none";
          window.location.href = "/dashboard";
        }, 1000);
      } else {
        // ❌ Show error alert
        showError(data.message || "Invalid email or password!");
      }
    } catch (err) {
      console.error("Login error:", err);
      showError("Server error. Try again later.");
    }
  });

  // 👁️ Password toggle
  document.querySelectorAll(".password-toggle").forEach((toggle) => {
    toggle.addEventListener("click", (event) => {
      event.preventDefault();
      const passwordInput = document.getElementById("password");
      const iconOn = toggle.querySelector(".on");
      const iconOff = toggle.querySelector(".off");

      const isVisible = passwordInput.type === "text";
      passwordInput.type = isVisible ? "password" : "text";

      iconOn.classList.toggle("d-none", !isVisible);
      iconOff.classList.toggle("d-none", isVisible);
    });
  });

  // ❌ Error alert function
  function showError(message) {
    const errorAlert = document.getElementById("loginErrorAlert");
    const errorMessage = document.getElementById("loginErrorMessage");

    if (errorAlert && errorMessage) {
      errorMessage.textContent = message;
      errorAlert.style.display = "block";

      setTimeout(() => {
        errorAlert.style.display = "none";
      }, 1000);
    }
  }
});

