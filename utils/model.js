/*
 * reqAB
 * prepare a default set of data/utilities for our api request.
 */

module.exports = class Model {
    constructor(config, dbConn, AB) {
        this.config = config;
        this.dbConn = dbConn;

        this.AB = AB;

        this.parseConfig(this.config);
    }

    parseConfig(config) {
        for (var c in config) {
            if (typeof config[c] == "string") {
                var type = config[c];
                // TODO: default settings based upon type:
                // switch (type) { case "string": ... }
                config[c] = { type: type };
            }
        }

        if (typeof config.createdAt == "undefined") {
            config.createdAt = { type: "datetime" };
        }

        if (typeof config.updatedAt == "undefined") {
            config.updatedAt = { type: "datetime" };
        }
    }
    tableName(reject) {
        var tableName = this.dbConn.escapeId(this.config.table_name);
        var tenantID = this.AB.tenantID();
        if (tenantID != "??") {
            var connSettings = this.AB.configDB();
            if (
                connSettings &&
                connSettings.site &&
                connSettings.site.database
            ) {
                var tDB = this.dbConn.escapeId(
                    `${connSettings.site.database}-${tenantID}`
                );
                tableName = `${tDB}.${tableName}`;
            } else {
                tableName = null;
                var msg =
                    "!! Unable to decode site.database from our connection settings.";
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
        if (includeCreatedAt && this.config.createdAt) {
            usefulValues.createdAt = now;
        }
        if (includeUpdatedAt && this.config.updatedAt) {
            usefulValues.updatedAt = now;
        }
    }
    usefulCreateValues(values) {
        return this.usefulValues(values, true, true);
    }
    usefulUpdateValues(values) {
        return this.usefulValues(values, false, true);
    }
    create(values) {
        return new Promise((resolve, reject) => {
            // 1) generate proper table name
            // if we are told of a tenantID, then our tableName should be in
            // format: [tenantDB].[table_name]
            var tableName = this.tableName();
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
            var tableName = this.tableName();
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
                // TODO: should return the updated entry
                resolve(results);
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
