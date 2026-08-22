const sql = require('mssql');

const passwords = [
  '1997',
  '123',
  '123456',
  '1234',
  '1',
  'sa',
  'admin',
  'hc',
  'root',
  '12345678',
  '',
  '19971997',
  'sql',
  'database'
];

async function test(p) {
  const dbConfig = {
    user: 'sa',
    password: p,
    server: 'localhost',
    port: 1433,
    database: 'hc',
    options: {
      encrypt: false,
      trustServerCertificate: true,
      connectionTimeout: 1500
    }
  };
  try {
    const pool = await sql.connect(dbConfig);
    console.log(`SUCCESS with password: "${p}"`);
    await pool.close();
    return true;
  } catch (err) {
    if (err.message.includes("Login failed")) {
      // wrong password
    } else {
      console.log(`FAILED with password: "${p}" error: ${err.message}`);
    }
    return false;
  }
}

async function run() {
  for (let p of passwords) {
    const ok = await test(p);
    if (ok) break;
  }
  console.log("Done testing");
}

run();
