// /server/app.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const { sequelize } = require('./models'); // Import Sequelize instance
const collaborationRoutes = require('./routes/collaborationRoutes');
const operationRoutes = require('./routes/operationRoutes');
const pusherAuthRoute = require('./routes/pusherAuthRoute');
const createRateLimiter = require('./middlewares/rateLimiter');
const session = require('./config/session');

const app = express();

// Middleware
const globalLimiter = createRateLimiter(15 * 60 * 1000, 100);
app.use(globalLimiter);
app.use(cors()); // Enable CORS for all routes
app.use(bodyParser.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: false })); // Middleware to parse `application/x-www-form-urlencoded` data
app.use(session); // session config
app.use(express.static(path.join(__dirname, '../client/dist'))); // Serve static files from client app

// Routes
app.use('/api/collaborations', collaborationRoutes);
app.use('/api/operations', operationRoutes);
app.use('/api', pusherAuthRoute);

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "client", "dist", "index.html"));
})

// Database sync
sequelize.sync()
  .then(() => {
    console.log('Database & tables created!');
  })
  .catch(err => {
    console.error('Error syncing database:', err);
  });

// Export the app for testing or further usage
module.exports = app;
