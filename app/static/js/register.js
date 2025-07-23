// document.addEventListener("DOMContentLoaded", () => {
//   const form = document.getElementById("register-form");
//   const submitButton = document.getElementById("submit-button");

//   if (!form || !submitButton) {
//     console.error("❌ register-form or submit-button not found");
//     return;
//   }

//   submitButton.addEventListener("click", async (e) => {
//     e.preventDefault(); // Prevent default form submission

//     const email = form.email.value.trim();
//     const password = form.password.value.trim();
//     const confirm = form.confirm.value.trim();

//     // Validation
//     if (!email || !password || !confirm) {
//       alert("All fields are required.");
//       return;
//     }

//     const emailPattern = /^[^ ]+@[^ ]+\.[a-z]{2,3}$/;
//     if (!emailPattern.test(email)) {
//       alert("Invalid email format.");
//       return;
//     }

//     if (password.length < 6) {
//       alert("Password must be at least 6 characters.");
//       return;
//     }

//     if (password !== confirm) {
//       alert("Passwords do not match.");
//       return;
//     }

//     try {
//       // Submit the form data using Fetch API or AJAX
//       console.log("✅ Validation passed, submitting form");
//       form.submit(); // Submit the form if validation passes
//     } catch (error) {
//       console.error("❌ Error submitting form:", error);
//     }


//     // ✅ All validation passed – Send POST to Flask
//     try {
//       const response = await fetch("/register", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json"
//         },
//         body: JSON.stringify({ email, password })
//       });

//       const data = await response.json()

//       if (response.ok) {
//         alert("✅ Registered successfully");
//         // Optionally redirect
//         window.location.href = "/login";
//       } else {
//         alert("❌ " + (data.message || "Registration failed"));
//       }
//     } catch (err) {
//       console.error("Server error:", err);
//       alert("❌ Server error. Try again.");
//     }
//   });
// });

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("register-form");

  form.addEventListener("submit", async function (e) {
    e.preventDefault(); // ✅ Prevent form from submitting again

    const email = form.email.value.trim();
    //const password = form.password.value.trim();
    const password = document.getElementById('password').value;

    console.log("🔁 Registering:", { email, password });

    try {
      const res = await fetch("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok) {
        alert("✅ Registered successfully!");
        window.location.href = "/login";
      } else {
        alert("❌ " + (data.message || "Failed"));
      }
    } catch (err) {
      console.error("❌ Error:", err);
      alert("❌ Server error");
    }
  });
});


  document.querySelectorAll('.password-toggle').forEach(toggle => {
    toggle.addEventListener('click', function (e) {
      e.preventDefault();
      const input = this.nextElementSibling;
      const icons = this.querySelectorAll('em');
      if (input.type === "password") {
        input.type = "text";
        icons[0].style.display = "none"; // hide eye
        icons[1].style.display = "inline"; // show eye-off
      } else {
        input.type = "password";
        icons[0].style.display = "inline"; // show eye
        icons[1].style.display = "none"; // hide eye-off
      }
    });
  });