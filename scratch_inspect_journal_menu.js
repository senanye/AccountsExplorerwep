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
    
    console.log("\n=== tblTransAction records for fldTransType = 1 ===");
    const resHeader = await pool.request().query(`
      SELECT TOP 5 fldID, fldBranchNo, fldTransType, fldTransNo, fldDate, fldVoisherTotal, fldDescription 
      FROM dbo.tblTransAction 
      WHERE fldTransType = 1
    `);
    console.table(resHeader.recordset);
    
    if (resHeader.recordset.length > 0) {
      const transId = resHeader.recordset[0].fldID;
      console.log(`\n=== tblMoneyMove records for fldTransID = ${transId} (opening balance details) ===`);
      const resDetails = await pool.request().input('id', sql.Int, transId).query(`
        SELECT TOP 10 fldID, fldTransID, fldAccID, fldDebit, fldCredit, Debit, Credit, fldMoneyID, fldRID, fldNote 
        FROM dbo.tblMoneyMove 
        WHERE fldTransID = @id
      `);
      console.table(resDetails.recordset);
    }
    
    await sql.close();
  } catch (err) {
    console.error("DB error:", err);
  }
}

run();
