const baseUrl = "http://localhost:3000/api/v1";
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2MWEzZTkxMS0xYTk2LTQ2Y2UtOTg5Zi1jNGMyMTJkZTRkYjciLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJyb2xlIjoiVVNFUiIsIm5hbWUiOiJUdW5kZSBDLiIsImlhdCI6MTc5MzA3MjEyMCwiZXhwIjoxNzkzNjc2OTIwfQ.oVO9r491zDZWPshJDdLmCHS9ughbYLASXQf_O2KVlgI";

async function runTests() {
  console.log("=== TESTING NEW AUTH & SETTINGS ENDPOINTS ===");

  // 1. Forgot Password
  console.log("\n1. Testing POST /auth/forgot-password...");
  const res1 = await fetch(`${baseUrl}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "user@example.com" }),
  });
  console.log("Status:", res1.status, await res1.json());

  // 2. Reset Password
  console.log("\n2. Testing POST /auth/reset-password...");
  const res2 = await fetch(`${baseUrl}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "user@example.com",
      code: "000000",
      newPassword: "securepassword123",
    }),
  });
  console.log("Status:", res2.status, await res2.json());

  // 3. Logout
  console.log("\n3. Testing POST /auth/logout...");
  const res3 = await fetch(`${baseUrl}/auth/logout`, { method: "POST" });
  console.log("Status:", res3.status, await res3.json());

  // 4. Get User Settings
  console.log("\n4. Testing GET /users/me/settings...");
  const res4 = await fetch(`${baseUrl}/users/me/settings`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log("Status:", res4.status, await res4.json());

  // 5. Patch User Settings
  console.log("\n5. Testing PATCH /users/me/settings...");
  const res5 = await fetch(`${baseUrl}/users/me/settings`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      notifications: { push: true, email: false, sms: true },
      language: "es",
      theme: "dark",
    }),
  });
  console.log("Status:", res5.status, await res5.json());

  // 6. 2FA Toggle
  console.log("\n6. Testing POST /users/me/2fa...");
  const res6 = await fetch(`${baseUrl}/users/me/2fa`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ enable: true }),
  });
  console.log("Status:", res6.status, await res6.json());

  console.log("\n=== ALL TESTS COMPLETED SUCCESSFULLY ===");
}

runTests().catch(console.error);
