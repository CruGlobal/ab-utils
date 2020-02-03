/**
 * Tenant.js
 * define our DB operations.
 */
const AB = require("ab-utils");

module.exports = {
   table_name: "site_role",
   attributes: {
      uuid: { type: "uuid", required: true },

      name: "string",
      users: {
         collection: "User",
         via: "roles"
      },

      userForms: {
         collection: "UserForm",
         via: "roles",
         dominant: true
      }
   },
   beforeCreate: function(values, cb) {
      if (!values.uuid) {
         values.uuid = AB.uuid();
      }
      cb();
   }
};
