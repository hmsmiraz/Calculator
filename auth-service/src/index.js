require('dotenv').config();
require('./config/db');
require('./config/redis');

const app  = require('./app');
const PORT = process.env.PORT || 4001;

app.listen(PORT, () => {
  console.log(`\n✅ auth-service running on port ${PORT}`);
});
