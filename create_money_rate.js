const sql = require('mssql');
const fs = require('fs');
const path = require('path');
const configPath = path.join(__dirname, 'db_config.json');
if (!fs.existsSync(configPath)) {
  console.error('db_config.json not found');
  process.exit(1);
}
const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const mssqlConfig = {
  user: cfg.username,
  password: cfg.password,
  server: cfg.server,
  port: parseInt(cfg.port) || 1433,
  database: cfg.database,
  options: { encrypt: false, trustServerCertificate: true }
};
(async () => {
  try {
    const pool = await sql.connect(mssqlConfig);
    // Ensure tblMoneyRate exists
    await pool.request().query(`IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tblMoneyRate' AND xtype='U')
      CREATE TABLE dbo.tblMoneyRate (
        fldID INT IDENTITY(1,1) PRIMARY KEY,
        fldMoneyID INT NOT NULL,
        fldRate FLOAT NOT NULL,
        fldDate DATETIME NOT NULL DEFAULT GETDATE()
      );`);
    console.log('tblMoneyRate ensured');
    // Create or replace sp_InsertPosTransaction (simplified)
    // Split DROP and CREATE into separate queries for mssql driver compatibility
    await pool.request().query(`IF OBJECT_ID('dbo.sp_InsertPosTransaction','P') IS NOT NULL DROP PROCEDURE dbo.sp_InsertPosTransaction;`);
    await pool.request().query(`CREATE PROCEDURE dbo.sp_InsertPosTransaction
        @TransNumber INT,
        @BranchNo TINYINT,
        @UserID INT,
        @MoneyID INT,
        @Rate FLOAT,
        @TotalOrigAmt FLOAT,
        @TotalBaseAmt FLOAT,
        @TransType INT,
        @JsonDetails NVARCHAR(MAX)
      AS
      BEGIN
        SET NOCOUNT ON;
        BEGIN TRY
          BEGIN TRAN;
          DECLARE @TransID INT;
          INSERT INTO dbo.tblTransAction (fldTransNo, fldBranchName, fldAccBoxName, fldOK, fldClosed,
                                          fldMenuName, fldTransType, fldType, fldName, fldMoneyName,
                                          fldVoisherTotal, fldsymbol, fldRefDate, fldRefNo,
                                          fldDescription, fldTransID, fldAccountName, fldVoisherAccID)
          SELECT @TransNumber, dbo.fn_GetProviderName(), N'الصندوق العام', 0, 0,
                 N'سند صرف', @TransType, 1, N'', (SELECT fldName FROM dbo.tblMoney WHERE fldID=@MoneyID),
                 @TotalOrigAmt, (SELECT fldsymbol FROM dbo.tblMoney WHERE fldID=@MoneyID), GETDATE(), 0,
                 N'', @TransNumber, NULL, 29;
          SET @TransID = SCOPE_IDENTITY();
          -- Details insertion logic can be handled by app code (parsing @JsonDetails)
          COMMIT TRAN;
        END TRY
        BEGIN CATCH
          IF @@TRANCOUNT > 0 ROLLBACK TRAN;
          THROW;
        END CATCH
      END;`);
    console.log('sp_InsertPosTransaction created/updated');
    await pool.close();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
