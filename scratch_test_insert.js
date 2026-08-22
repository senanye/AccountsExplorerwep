const sql = require('mssql');
const fs = require('fs');

async function test() {
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

  console.log("Sending test Receipt Voucher to API...");
  const payload = {
    header: {
      fldBranchNo: 1,
      fldYaer: 26,
      fldTransType: 10, // Receipt (قبض)
      fldType: 1,
      fldTransNo: 0, // Auto-number
      fldDate: "2026-06-14",
      fldRefDate: "2026-06-14",
      fldDescription: "سند تجريبي لتأكيد القيد المتزن",
      fldRefNo: 999,
      fldName: "العميل التجريبي",
      fldVoisherAccID: 29, // Box account
      fldVoisherMoneyID: 2, // Currency ID (e.g. YR)
      fldVoisherMoneyValue: 1.0,
      fldVoisherTotal: 5000.00,
      fldDiscount: 0.00
    },
    details: [
      {
        fldAccID: 111, // Detail account
        fldDebit: 0.00, // Credit the client
        fldCredit: 5000.00,
        Debit: 0.00,
        Credit: 5000.00,
        fldMoneyID: 2,
        fldMoneyValue: 1.0,
        fldNote: "دفعة تجريبية",
        fldRefNo: 999,
        fldRefDate: "2026-06-14"
      }
    ]
  };

  try {
    const response = await fetch('http://localhost:3000/api/vouchers', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-user-id': '1'
      },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    console.log("API Response:", result);
    
    if (result.success && result.transID) {
      const transID = result.transID;
      
      const pool = await sql.connect(dbConfig);
      console.log("\n=== tblTransAction Header Row ===");
      const resHeader = await pool.request()
        .input('id', sql.Int, transID)
        .query("SELECT fldID, fldBranchNo, fldTransType, fldTransNo, fldVoisherAccID, fldVoisherTotal, fldDescription FROM dbo.tblTransAction WHERE fldID = @id");
      console.table(resHeader.recordset);

      console.log("\n=== tblMoneyMove Rows (Double Entry) ===");
      const resMove = await pool.request()
        .input('id', sql.Int, transID)
        .query("SELECT fldID, fldTransID, fldAccID, fldDebit, fldCredit, Debit, Credit, fldMoneyID, fldRID, fldNote FROM dbo.tblMoneyMove WHERE fldTransID = @id");
      console.table(resMove.recordset);
      
      console.log("\nCleaning up test records from DB...");
      await pool.request().input('id', sql.Int, transID).query("DELETE FROM dbo.tblMoneyMove WHERE fldTransID = @id");
      await pool.request().input('id', sql.Int, transID).query("DELETE FROM dbo.tblTransAction WHERE fldID = @id");
      console.log("Cleanup done.");

      await sql.close();
    }
  } catch (err) {
    console.error("Test Error:", err);
  }
}

test();
