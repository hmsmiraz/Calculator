require('dotenv').config();
require('./config/db'); // test DB connection on boot

const app  = require('./app');
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log('\n🚀 Calculator API v2 Started');
  console.log('================================');
  console.log(`🌍 Environment : ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 Port        : ${PORT}`);
  console.log(`🔗 URL         : http://localhost:${PORT}`);
  console.log(`🔐 Auth        : http://localhost:${PORT}/api/v1/auth`);
  console.log(`🧮 Calculator  : http://localhost:${PORT}/api/v1/calculator`);
  console.log('================================\n');
});

process.on('SIGINT', () => {
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});
