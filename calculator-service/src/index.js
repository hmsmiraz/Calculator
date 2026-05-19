require('dotenv').config();
require('./config/db');
require('./config/redis');

const app  = require('./app');
const PORT = process.env.PORT || 4002;

app.listen(PORT, () => {
  console.log(`\n✅ calculator-service running on port ${PORT}`);
});
