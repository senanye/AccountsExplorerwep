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
    
    // Select unique fldFormatValue and name of accounts that have fldIs_Primary = 1
    const res = await pool.request().query("SELECT DISTINCT fldFormatValue, fldName, fldNumber, fldID FROM dbo.tblAccount WHERE fldIs_Primary = 1 ORDER BY fldFormatValue");
    console.log("--- UNIQUE FORMAT VALUES FOR PRIMARY ACCOUNTS ---");
    console.log(res.recordset);

    // Let's check all accounts where fldFormatValue is 4 or similar
    const format4 = await pool.request().query("SELECT fldID, fldNumber, fldName, fldFormatValue FROM dbo.tblAccount WHERE fldFormatValue = 4 OR fldNumber = '1234'");
    console.log("--- FORMAT VALUE 4 OR NUMBER 1234 ---");
    console.log(format4.recordset);
    
    await sql.close();
  } catch (err) {
    console.error(err);
  }
}
run();
