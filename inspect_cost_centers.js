const sql = require('mssql');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('db_config.json', 'utf8'));

const dbConfig = {
  user: config.username,
  password: config.password,
  server: config.server,
  port: parseInt(config.port),
  database: config.database,
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

async function run() {
  try {
    const pool = await sql.connect(dbConfig);
    console.log("Connected to DB");

    const res = await pool.request().query("SELECT fldID, fldName FROM dbo.tblCostCenter");
    console.log("--- COST CENTERS ---");
    res.recordset.forEach(row => {
      console.log(`ID: ${row.fldID} | Name: ${row.fldName}`);
    });

    await sql.close();
  } catch (err) {
    console.error("DB error:", err);
  }
}

run();
