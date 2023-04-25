/**
 * utility functions to help with our initial config values:
 * @module defaults
 * @ignore
 */

/**
 * @param {string} envKey
 *                 the specific process.env[key] value we are requesting
 * @param {multi} defaultValue [optional]
 *                the value to return if the envKey is not provided.
 * @returns {multi}
 */
function env(envKey, defaultValue) {
   if (typeof process.env[envKey] == "undefined" || process.env[envKey] == "") {
      return defaultValue;
   }
   try {
      return JSON.parse(process.env[envKey]);
   } catch (e) {
      console.log(e);
      console.log(`process.env[${envKey}]=[${process.env[envKey]}]`);
      return process.env[envKey];
   }
}

module.exports = {
   env,
   datastores: () => {
      return {
         appbuilder: {
            adapter: "sails-mysql",
            host: env("MYSQL_HOST", "db"),
            port: env("MYSQL_PORT", 3306),
            user: env("MYSQL_USER", "root"),
            password: process.env.MYSQL_PASSWORD,
            database: env("MYSQL_DBPREFIX", "appbuilder"),
         },
         site: {
            adapter: "sails-mysql",
            host: env("MYSQL_HOST", "db"),
            port: env("MYSQL_PORT", 3306),
            user: env("MYSQL_USER", "root"),
            password: process.env.MYSQL_PASSWORD,
            database: env("MYSQL_DBADMIN", "appbuilder-admin"),
         },
      };
   },
};
