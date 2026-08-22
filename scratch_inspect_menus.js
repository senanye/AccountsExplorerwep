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
    
    // Query tblMenus for fldID 3 and 4
    console.log("\n=== tblMenus for IDs 3 and 4 ===");
    const resMenus = await pool.request().query("SELECT * FROM dbo.tblMenus WHERE fldID IN (3, 4, 10, 11)");
    console.table(resMenus.recordset);
    
    // Check if there are existing records for fldTransType = 3 or 4 in tblTransAction
    console.log("\n=== Existing tblTransAction records for fldTransType 3 or 4 ===");
    const resTrans = await pool.request().query("SELECT fldTransType, COUNT(*) AS count FROM dbo.tblTransAction WHERE fldTransType IN (3, 4) GROUP BY fldTransType");
    console.table(resTrans.recordset);
    
    await sql.close();
  } catch (err) {
    console.error("DB error:", err);
  }
}

run();
