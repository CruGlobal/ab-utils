//
// config
// read in this service's config file, merge it with the settings in the common
// local.js file, and return those values.
var path = require("path");
var _ = require("lodash");
module.exports = (baseFile) => {
   // baseConfig should be included as part of the project
   var baseConfig = {};
   try {
      baseFile = baseFile || "";
      if (baseFile != "") {
         baseConfig = require(path.join(
            process.cwd(),
            "config",
            baseFile + ".js"
         ));

         // adjust for sails style config referencing
         if (baseConfig[baseFile]) {
            baseConfig = baseConfig[baseFile];
         }
      }
   } catch (e) {
      baseConfig = {};
   }

   var localConfig;
   try {
      // try to locate a config/local.js as well.
      localConfig = require(path.join(process.cwd(), "config", "local.js"));
      if (localConfig[baseFile]) {
         // config/local.js values should override the baseConfig values
         var local = localConfig[baseFile];
         _.defaultsDeep(local, baseConfig);

         baseConfig = local;
      }
   } catch (e) {
      console.log("!!!!", e);
   }

   return baseConfig;
};
