/*
 * dbConn
 * manage and return a connection to our DB.
 */
const Mysql = require("mysql"); // our  {DB Connection}
var DB = null;
// {Mysql}
// DB is a {Mysql} library connection to the Mysql DB that houses our Tenant(s)
// data. It is not expected to be a SPECIFIC connection to a Tenant's database
// directly. Instead any SQL run through this is expected to specify the
// Tenant DB in the SQL.  But DB connects to the running {MySQL|Mariadb} server
// that houses the data.

module.exports = function (req, shouldCreate = true) {
   if (!DB) {
      if (shouldCreate) {
         var config = req.configDB();
         config.connectionLimit = 10;
         DB = Mysql.createPool(config);
         DB.on("error", (err) => {
            req.log("DB.on(error):", err);

            // {
            //   Error: "read ECONNRESET at TCP.onStreamRead (internal/stream_base_commons.js:162:27)",
            //   errno: 'ECONNRESET',
            //   code: 'ECONNRESET',
            //   syscall: 'read',
            //   fatal: true
            // }
            DB.end();
            DB = null; // reset our connection.
         });
         // DB.connect(function(err) {
         //    if (err) {
         //       AB.log("error connecting: " + err, AB.configDB());
         //       return;
         //    }
         //    AB.log("connected as  id " + DB.threadId);
         // });
      }
   }
   return DB;
};
