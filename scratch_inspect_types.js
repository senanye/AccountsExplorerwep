const sql = require('mssql');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('./db_config.json', 'utf8'));

async function inspectMainTypes() {
  try {
    const pool = await sql.connect({
      user: config.username,
      password: config.password,
      server: config.server,
      port: parseInt(config.port) || 1433,
      database: config.database,
      options: {
        encrypt: false,
        trustServerCertificate: true
      }
    });

    const resTypes = await pool.request().query("SELECT DISTINCT fldType, fldTransID, fldDescription FROM Main");
    console.log("=== Distinct Types in Main ===");
    console.log(resTypes.recordset);

    const sampleRows = await pool.request().query("SELECT TOP 20 * FROM Main");
    console.log("=== Sample Rows in Main ===");
    console.log(sampleRows.recordset);

    pool.close();
  } catch(err) {
    console.error(err);
  }
}

inspectMainTypes();
