/*
 * reqAB
 * prepare a default set of data/utilities for our api request.
 */
const _ = require("lodash");

module.exports = class Model {
   constructor(config, dbConn, AB) {
      this.config = _.cloneDeep(config);
      this.dbConn = dbConn;

      this.AB = AB;

      // defaults:
      this.config.attributes = this.config.attributes || {};

      if (typeof this.config.site_only == "undefined") {
         this.config.site_only = false;
      }

      this.parseAttributes(this.config.attributes);
   }

   attributes(fn) {
      if (!fn)
         fn = function() {
            return true;
         };
      var allAttributes = Object.keys(this.config.attributes).map((k) => {
         return this.config.attributes[k];
      });
      return allAttributes.filter(fn);
   }

   parseAttributes(attributes) {
      if (attributes.createdAt == "false") attributes.createdAt = false;
      if (attributes.updatedAt == "false") attributes.updatedAt = false;

      if (typeof attributes.createdAt == "undefined" || attributes.createdAt) {
         attributes.createdAt = {
            type: "datetime",
            column_name: "createdAt",
            attr_name: "createdAt"
         };
      } else {
         delete attributes.createdAt;
      }

      if (typeof attributes.updatedAt == "undefined" || attributes.updatedAt) {
         attributes.updatedAt = {
            type: "datetime",
            column_name: "updatedAt",
            attr_name: "updatedAt"
         };
      } else {
         delete attributes.updatedAt;
      }

      for (var c in attributes) {
         if (typeof attributes[c] == "string") {
            var type = attributes[c];
            // TODO: default settings based upon type:
            // switch (type) { case "string": ... }
            attributes[c] = { type: type };
         }

         if (!attributes[c]["column_name"]) {
            attributes[c]["column_name"] = c;
         }

         // hard code the attribute name
         attributes[c]["attr_name"] = c;
      }
   }

   tableName(reject) {
      var tableName = this.dbConn.escapeId(this.config.table_name);
      var tenantID = this.AB.tenantID();
      if (tenantID && !this.config.site_only) {
         var connSettings = this.AB.configDB();
         if (connSettings && connSettings.database) {
            var tDB = this.dbConn.escapeId(
               `${connSettings.database}-${tenantID}`
            );
            tableName = `${tDB}.${tableName}`;
         } else {
            tableName = null;
            var msg =
               "!! Unable to decode database from our connection settings.";
            this.AB.log(msg, this.AB.configDB());
            var error = new Error(msg);
            error.code = "E_CONFIG_ERROR";
            reject(error);
         }
      }
      return tableName;
   }

   usefulValues(values, includeCreatedAt, includeUpdatedAt) {
      var usefulValues = {};
      for (var v in values) {
         // make sure this field is one of our own:
         if (this.config.attributes[v]) {
            usefulValues[v] = values[v];
         }
      }

      // TODO: check to see if createdAt and updatedAt are disabled
      var now = new Date();
      if (includeCreatedAt && this.config.attributes.createdAt) {
         usefulValues.createdAt = now;
      }
      if (includeUpdatedAt && this.config.attributes.updatedAt) {
         usefulValues.updatedAt = now;
      }

      return usefulValues;
   }
   usefulCreateValues(values) {
      return this.usefulValues(values, true, true);
   }
   usefulUpdateValues(values) {
      return this.usefulValues(values, false, true);
   }

   normalizeResponse(results) {
      var sendSingle = false;
      if (!Array.isArray(results)) {
         sendSingle = true;
         results = [results];
      }

      var finalResults = [];

      var allFields = this.attributes();

      // type:"json" => JSON.parse();
      var jsonFields = this.attributes((a) => {
         return a.type == "json";
      });

      results.forEach((r) => {
         // convert JSON types to objects
         jsonFields.forEach((f) => {
            var value = r[f.column_name];
            if (!value) return;
            if (typeof value == "string") {
               try {
                  r[f.column_name] = JSON.parse(value);
               } catch (e) {
                  console.log(`error JSON.parse() [${value}]`);
               }
            }
         });

         // copy into new entry with property names
         var entry = {};
         allFields.forEach((f) => {
            if (typeof r[f.column_name] != "undefined") {
               entry[f.attr_name] = r[f.column_name];
            }
         });

         finalResults.push(entry);
      });

      if (sendSingle) {
         finalResults = finalResults[0];
      }

      return finalResults;
   }

   create(values) {
      return new Promise((resolve, reject) => {
         // 1) generate proper table name
         // if we are told of a tenantID, then our tableName should be in
         // format: [tenantDB].[table_name]
         var tableName = this.tableName(reject);
         if (!tableName) {
            return;
         }

         var usefulValues = this.usefulCreateValues(values);

         this.dbConn.query(`INSERT INTO ${tableName} SET ?`, usefulValues, (
            error /* ,results, fields*/
         ) => {
            // error will be an Error if one occurred during the query
            // results will contain the results of the query
            // fields will contain information about the returned results fields (if any)

            if (error) {
               // TODO: identify specific errors and handle them if we can.
               reject(error);
               return;
            }
            // TODO: should return the updated entry
            resolve();
         });
      });
   }
   destroy(cond) {
      return new Promise((resolve, reject) => {
         // 1) generate proper table name
         // if we are told of a tenantID, then our tableName should be in
         // format: [tenantDB].[table_name]
         var tableName = this.tableName(reject);
         if (!tableName) {
            return;
         }

         this.dbConn.query(`DELETE FROM ${tableName} WHERE ?`, cond, (
            error /* ,results, fields*/
         ) => {
            // error will be an Error if one occurred during the query
            // results will contain the results of the query
            // fields will contain information about the returned results fields (if any)

            if (error) {
               // TODO: identify specific errors and handle them if we can.
               reject(error);
               return;
            }
            // TODO: should return the updated entry
            resolve();
         });
      });
   }
   find(cond) {
      return new Promise((resolve, reject) => {
         var tableName = this.tableName(reject);
         if (!tableName) {
            return;
         }

         var query = `SELECT * FROM ${tableName} `;
         if (cond) {
            query += "WHERE ?";
         }
         this.dbConn.query(query, cond, (error, results /*, fields*/) => {
            // error will be an Error if one occurred during the query
            // results will contain the results of the query
            // fields will contain information about the returned results fields (if any)

            if (error) {
               // TODO: identify specific errors and handle them if we can.
               reject(error);
               return;
            }

            Promise.resolve()
               .then(() => {
                  // update field values
                  return this.normalizeResponse(results);
               })
               .then((final) => {
                  // TODO: should return the updated entry
                  resolve(final);
               });
         });
      });
   }
   update(cond, values) {
      return new Promise((resolve, reject) => {
         var tableName = this.tableName(reject);
         if (!tableName) {
            return;
         }

         var usefulValues = this.usefulUpdateValues(values);

         this.dbConn.query(
            `UPDATE ${tableName} SET ? WHERE ?`,
            [usefulValues, cond],
            (error /* ,results, fields*/) => {
               // error will be an Error if one occurred during the query
               // results will contain the results of the query
               // fields will contain information about the returned results fields (if any)

               if (error) {
                  // TODO: identify specific errors and handle them if we can.
                  reject(error);
                  return;
               }
               // TODO: should return the updated entry
               resolve();
            }
         );
      });
   }
};
