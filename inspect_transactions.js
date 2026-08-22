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

    console.log("\nSearching for moves where fldDebit=200 or fldCredit=200 or Debit=200 or Credit=200...");
    const res = await pool.request().query(`
      SELECT m.fldID, m.fldTransID, m.fldAccID, a.fldName AS AccName, m.fldMoneyID, cur.fldName AS CurrencyName,
             m.fldDebit, m.fldCredit, m.Debit, m.Credit, m.fldNote,
             t.fldTransNo, t.fldDate, menu.fldDescription AS TransTypeName
      FROM dbo.tblMoneyMove m
      INNER JOIN dbo.tblTransAction t ON m.fldTransID = t.fldID
      INNER JOIN dbo.tblAccount a ON m.fldAccID = a.fldID
      LEFT JOIN dbo.tblMoney cur ON m.fldMoneyID = cur.fldID
      LEFT JOIN dbo.tblMenus menu ON t.fldTransType = menu.fldID
      WHERE m.fldDebit = 200 OR m.fldCredit = 200 OR m.Debit = 200 OR m.Credit = 200
    `);
    
    res.recordset.forEach(row => {
      console.log(`TransID: ${row.fldTransID} | Date: ${row.fldDate.toISOString().split('T')[0]} | Type: ${row.TransTypeName} | No: ${row.fldTransNo} | Note: ${row.fldNote}`);
      console.log(`  Acc: ${row.AccName} (ID: ${row.fldAccID}) | Currency: ${row.CurrencyName}`);
      console.log(`  Local: fldDebit=${row.fldDebit}, fldCredit=${row.fldCredit}`);
      console.log(`  Trans: Debit=${row.Debit}, Credit=${row.Credit}`);
    });

    await sql.close();
  } catch (err) {
    console.error("DB error:", err);
  }
}

run();
