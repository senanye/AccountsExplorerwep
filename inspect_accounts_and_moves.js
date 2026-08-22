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
    
    // 1. Get Cash/Box accounts
    const accs = await pool.request().query("SELECT fldID, fldNumber, fldName FROM dbo.tblAccount WHERE fldName LIKE '%صندوق%' OR fldName LIKE '%الصندوق%'");
    console.log("--- CASH ACCOUNTS ---");
    accs.recordset.forEach(row => {
      console.log(`ID: ${row.fldID} | Number: ${row.fldNumber} | Name: ${row.fldName}`);
    });

    // 2. Get some moves for one of the cash accounts
    if (accs.recordset.length > 0) {
      for (let acc of accs.recordset) {
        const boxId = acc.fldID;
        const countRes = await pool.request().input('boxId', sql.Int, boxId).query("SELECT COUNT(*) AS cnt FROM dbo.tblMoneyMove WHERE fldAccID = @boxId");
        console.log(`Account ID: ${boxId} | Name: ${acc.fldName} | Transactions Count: ${countRes.recordset[0].cnt}`);
        
        if (countRes.recordset[0].cnt > 0) {
          console.log(`\n--- TOP 5 TRANSACTIONS FOR ${acc.fldName} ---`);
          const moves = await pool.request()
            .input('boxId', sql.Int, boxId)
            .query(`
              SELECT TOP 5 
                m.fldID, m.fldTransID, m.fldAccID, m.fldMoneyID, cur.fldName AS CurrencyName,
                m.fldDebit, m.fldCredit, m.Debit, m.Credit, m.fldNote,
                t.fldTransNo, t.fldDate, menu.fldDescription AS TransTypeName
              FROM dbo.tblMoneyMove m
              INNER JOIN dbo.tblTransAction t ON m.fldTransID = t.fldID
              LEFT JOIN dbo.tblMoney cur ON m.fldMoneyID = cur.fldID
              LEFT JOIN dbo.tblMenus menu ON t.fldTransType = menu.fldID
              WHERE m.fldAccID = @boxId
              ORDER BY t.fldDate DESC, m.fldID DESC
            `);
          moves.recordset.forEach(row => {
            console.log(`MoveID: ${row.fldID} | TransID: ${row.fldTransID} | Date: ${row.fldDate.toISOString().split('T')[0]} | Type: ${row.TransTypeName} | No: ${row.fldTransNo} | Note: ${row.fldNote}`);
            console.log(`  Currency: ${row.CurrencyName} (ID: ${row.fldMoneyID})`);
            console.log(`  Local: fldDebit=${row.fldDebit}, fldCredit=${row.fldCredit}`);
            console.log(`  Trans: Debit=${row.Debit}, Credit=${row.Credit}`);
          });
        }
      }
    }

    await sql.close();
  } catch (err) {
    console.error("DB error:", err);
  }
}

run();
