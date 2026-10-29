/**
 * Admin login page logic
 */
(function () {
  // If already logged in, redirect to bookings
  if (window.API.getToken()) {
    window.location.href = "/admin/bookings.html";
    return;
  }

  const hotelNameEl = document.getElementById("admin-login-hotel-name");
  if (hotelNameEl && window.CONFIG) {
    hotelNameEl.textContent = window.CONFIG.HOTEL_NAME;
  }

  const form = document.getElementById("login-form");
  const emailInput = document.getElementById("admin-email");
  const passwordInput = document.getElementById("admin-password");
  const submitBtn = document.getElementById("login-submit-btn");
  const errorBox = document.getElementById("login-error-alert");
  const errorText = document.getElementById("login-error-text");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorBox.style.display = "none";
    errorText.textContent = "";

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      errorText.textContent = "Please enter both email and password.";
      errorBox.style.display = "flex";
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Signing In...";

    try {
      const res = await window.API.login(email, password);
      if (res && res.token) {
        window.API.setToken(res.token);
        window.location.href = "/admin/bookings.html";
      } else {
        throw new Error("No token returned by server");
      }
    } catch (err) {
      // Show 401 or other message safely using textContent
      errorText.textContent = err.message || "Invalid email or password.";
      errorBox.style.display = "flex";
      submitBtn.disabled = false;
      submitBtn.textContent = "Sign In";
    }
  });
})();
