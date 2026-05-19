require('dotenv').config();
const app   = require('./app');
const redis = require('./utils/redis');

const PORT = process.env.PORT || 4000;

redis.connect().catch(() => console.warn('⚠️  Redis not available — rate limiting disabled'));

app.listen(PORT, () => {
  console.log('\n🚀 API Gateway Started');
  console.log('================================');
  console.log(`📡 Port        : ${PORT}`);
  console.log(`🔗 URL         : http://localhost:${PORT}`);
  console.log(`🔐 Auth        : → ${process.env.AUTH_SERVICE_URL}`);
  console.log(`🧮 Calculator  : → ${process.env.CALC_SERVICE_URL}`);
  console.log(`👤 User        : → ${process.env.USER_SERVICE_URL}`);
  console.log('================================\n');
});
