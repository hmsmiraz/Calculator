require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const server = app.listen(PORT, () => {
  console.log('\n🚀 Calculator API Server Started');
  console.log('================================');
  console.log(`🌍 Environment : ${NODE_ENV}`);
  console.log(`📡 Port        : ${PORT}`);
  console.log(`🔗 URL         : http://localhost:${PORT}`);
  console.log(`📘 API Base    : http://localhost:${PORT}/api/v1/calculator`);
  console.log('================================\n');
});

process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});
