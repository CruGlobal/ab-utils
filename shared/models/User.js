/**
 * Tenant.js
 * define our DB operations.
 */
const { v4: uuid } = require("uuid");
const nanoid = require("nanoid");
const path = require("path");
const utils = require(path.join(__dirname, "..", "utils", "utils.js"));

module.exports = {
   table_name: "site_user",
   attributes: {
      uuid: { type: "uuid", required: true },
      username: "string",
      email: "string",
      password: "string",
      salt: "string",
      languageCode: "string",

      isActive: "bool",
      lastLogin: "datetime",
      failedLogins: "integer",
      image_id: "string",
      token: "string",
      roles: {
         collection: "Role",
         via: "users",
         dominant: true,
      },

      userForms: {
         collection: "UserForm",
         via: "users",
         dominant: true,
      },
   },
   beforeCreate: function (values, cb) {
      if (!values.uuid) {
         values.uuid = uuid();
      }

      // we generate .token
      values.token = nanoid(30);

      values.failedLogins = 0;

      if (values.password) {
         values.salt = utils.generateSalt();
         utils
            .hash(values.password, values.salt)
            .then((hashedPassword) => {
               values.password = hashedPassword;
               cb();
            })
            .catch(cb);
      } else {
         cb();
      }
   },
};
