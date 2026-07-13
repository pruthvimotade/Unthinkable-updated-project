const axios = require('axios');
(async () => {
  try {
    const res = await axios.post('http://localhost:4000/api/v1/auth/register', {
      email: "test4@example.com",
      password: "Password123!",
      name: "Test User 4",
      role: "CUSTOMER",
      phone: "+919876543210"
    });
    console.log("Success:", res.data);
  } catch (err) {
    console.error("Error:", err.response ? err.response.data : err.message);
  }
})();
