

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

    // ✅ Client-side validation
    if (!email || !password) {
      alert("Both email and password are required.");
      return;
    }

    const emailPattern = /^[^ ]+@[^ ]+\.[a-z]{2,3}$/;
    if (!emailPattern.test(email)) {
      alert("Invalid email format.");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    // ✅ Send login request to Flask
    try {
      const response = await fetch("/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log(data);

      if (response.ok) {
        // ✅ Custom success alert instead of alert()
        const successAlert = document.getElementById('loginSuccessAlert');
        if (successAlert) {
          successAlert.style.display = 'block';
        }

        // Store session info
        localStorage.setItem('session_id', data.session_id);
        localStorage.setItem('user_id', data.user_id);

        // Redirect after 3s
        setTimeout(() => {
          if (successAlert) {
            successAlert.style.display = 'none';
          }
          window.location.href = "/dashboard";
        }, 3000);
      } else {
        alert("❌ " + (data.message || "Login failed"));
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("❌ Server error. Try again later.");
    }
  });
});

// 🔐 Password toggle logic
function togglePassword(event) {
  event.preventDefault(); // prevent the default anchor behavior

  const toggle = event.currentTarget;
  const passwordInput = document.getElementById('password');
  const iconOn = toggle.querySelector('.on');
  const iconOff = toggle.querySelector('.off');

  const isPasswordVisible = passwordInput.type === 'text';

  passwordInput.type = isPasswordVisible ? 'password' : 'text';

  // Toggle icons
  if (isPasswordVisible) {
    iconOn.classList.remove('d-none');
    iconOff.classList.add('d-none');
  } else {
    iconOn.classList.add('d-none');
    iconOff.classList.remove('d-none');
  }
}
