const { Client } = require('pg');
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/english-platform';
(async () => {
  try {
    const adminUrl = DATABASE_URL.replace(/\/english-platform\/?$/, '/postgres');
    const client = new Client({ connectionString: adminUrl });
    await client.connect();
    const dbName = 'english-platform';
    const res = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
    if (res.rows.length === 0) {
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log('Created database', dbName);
    } else {
      console.log('Database already exists:', dbName);
    }
    await client.end();
  } catch (e) {
    console.error('Error creating/checking database:', e.message);
    process.exit(1);
  }
})();
