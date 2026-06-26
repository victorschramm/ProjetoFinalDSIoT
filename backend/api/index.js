require('dotenv').config();
const sequelize = require('../src/config/database');
const app = require('../src/app');

// Sync DB on cold start (no MQTT/WebSocket for serverless)
let synced = false;
const originalListen = app.listen.bind(app);
app.listen = (...args) => originalListen(...args);

sequelize.sync({ alter: false }).then(() => {
  synced = true;
}).catch(err => {
  console.error('DB sync error:', err.message);
});

module.exports = app;
