const sql = require('mssql');

const configs = [
  { server: '100.111.54.127', user: 'sa', password: '1997', database: 'hc' },
  { server: '100.85.162.98', user: 'sa', password: '1997', database: 'hc' },
  { server: 'localhost', user: 'sa', password: '1997', database: 'hc' },
  { server: '127.0.0.1', user: 'sa', password: '1997', database: 'hc' }
];

async function test(c) {
  const dbConfig = {
    user: c.user,
    password: c.password,
    server: c.server,
    port: 1433,
    database: c.database,
    options: {
      encrypt: false,
      trustServerCertificate: true,
      connectionTimeout: 3000
    }
  };
  try {
    const pool = await sql.connect(dbConfig);
    console.log(`SUCCESS connected to ${c.server}`);
    await pool.close();
    return true;
  } catch (err) {
    console.log(`FAILED connected to ${c.server}: ${err.message}`);
    return false;
  }
}

async function run() {
  for (let c of configs) {
    await test(c);
  }
}

run();
