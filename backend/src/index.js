require('dotenv').config();
require('./config/db'); // test DB connection on boot

const cors = require('cors');
const app  = require('./app');

app.use(cors());

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('\n🚀 Calculator API v2 Started');
  console.log('================================');
  console.log(`🌍 Environment : ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 Port        : ${PORT}`);
  console.log(`🔗 URL         : http://0.0.0.0:${PORT}`);
  console.log(`🔐 Auth        : http://0.0.0.0:${PORT}/api/v1/auth`);
  console.log(`🧮 Calculator  : http://0.0.0.0:${PORT}/api/v1/calculator`);
  console.log('================================\n');
});

process.on('SIGINT', () => {
  console.log('\nShutting down server...');

  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});