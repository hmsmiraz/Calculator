require('dotenv').config();
require('./config/db');
require('./config/redis');

const app  = require('./app');
const PORT = process.env.PORT || 4003;

app.listen(PORT, () => {
  console.log(`\n✅ user-service running on port ${PORT}`);
});
