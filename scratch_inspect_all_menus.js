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
    
    const res = await pool.request().query("SELECT m.fldID, m.fldtblMainMenuID, m.fldDescription AS MenuName, mm.fldDescription AS MainMenuName FROM dbo.tblMenus m LEFT JOIN dbo.tblMainMenu mm ON m.fldtblMainMenuID = mm.fldID ORDER BY mm.fldID, m.fldID");
    
    console.log("--- MENUS ---");
    for (let row of res.recordset) {
      console.log(`ID: ${row.fldID} | MainMenuID: ${row.fldtblMainMenuID} | Menu: ${row.MenuName} | MainMenu: ${row.MainMenuName}`);
    }
    
    await sql.close();
  } catch (err) {
    console.error("DB error:", err);
  }
}

run();
