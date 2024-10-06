// /server/server.js
const app = require('./app'); // Import the app from app.js
const PORT = process.env.PORT || 3000; // Set the port

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
