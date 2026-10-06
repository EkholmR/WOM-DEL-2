require('dotenv').config();

for (const name of ['DATABASE_URL', 'JWT_SECRET']) {
  if (!process.env[name]) {
    console.error(`Missing environment variable: ${name}`);
    process.exit(1);
  }
}

const app = require('./app');

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API listening on port ${port}`));