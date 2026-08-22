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
    
    const res = await pool.request().query("SELECT fldID, fldDescription FROM dbo.tblMenus WHERE fldDescription LIKE N'%استاذ%' OR fldDescription LIKE N'%الأستاذ%' OR fldDescription LIKE N'%أستاذ%'");
    console.log("--- MATCHING MENUS ---");
    console.log(res.recordset);
    
    await sql.close();
  } catch (err) {
    console.error(err);
  }
}
run();
