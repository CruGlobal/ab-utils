/*
 * dbConn
 * manage and return a connection to our DB.
 */
const Mysql = require("mysql"); // our  {DB Connection}
var DB = null;

module.exports = function(AB, shouldCreate = true) {
   if (!DB) {
      if (shouldCreate) {
         DB = Mysql.createConnection(AB.configDB());
         DB.on("error", (err) => {
            AB.log("DB.on(error):", err);

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
         DB.connect(function(err) {
            if (err) {
               AB.log("error connecting: " + err, AB.configDB());
               return;
            }
            AB.log("connected as  id " + DB.threadId);
         });
      }
   }
   return DB;
};
