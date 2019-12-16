/*
 * request
 *
 * return a modified req object that supports our typical AB functions.
 * @param {obj} req the standard request object received from the Cote service.
 * @return {ABRequest}
 */
const path = require("path");
const DBConn = require(path.join(__dirname, "dbConn"));
const Model = require(path.join(__dirname, "model"));

class ABRequest {
    constructor(req, controller) {
        // console.log("ABRequest():", req);
        this.jobID = req.jobID || "??";
        this.tenantID = req.tenantID || "??";
        this.data = req.data || req.param;
        this.controller = controller;
    }

    config() {
        return this.controller.config;
    }

    /**
     * configDB()
     * return the proper DB connection data for the current request.
     * If the request HAS a tenantID, we return the 'appbuilder' connection,
     * If no tenantID, then we return the 'site' connection.
     */
    configDB() {
        var defs = this.controller.connections;
        if (this.tenantID != "??") {
            if (defs.appbuilder) {
                return defs.appbuilder;
            } else {
                this.log("Error: No 'appbuilder' connection defined:", defs);
                return null;
            }
        } else {
            if (defs.site) {
                return defs.site;
            } else {
                this.log("Error: No 'site' connection defined:", defs);
                return null;
            }
        }
    }

    /**
     * dbConnection()
     * return a connection to our mysql DB for the current request:
     * @param {bool} create
     *        create a new DB connection if we are not currentl connected.
     * @return {Mysql.conn || null}
     */
    dbConnection(create = true) {
        return DBConn(this, create);
    }

    /**
     * log()
     * print out a log entry for the current request
     * @param {...} allArgs
     *        array of possible log entries
     */
    log(...allArgs) {
        var args = [];
        allArgs.forEach((a) => {
            args.push(JSON.stringify(a));
        });
        console.log(`${this.jobID}::${args.join(" ")}`);
    }

    /**
     * model(name)
     * Return a Model() instance from the model/name.js definition
     * @param {string} name
     *        name of the model/[name].js definition to return a Model for.
     * @return {Model || null}
     */
    model(name) {
        if (this.controller.models[name]) {
            var db = this.dbConnection();
            return new Model(this.controller.models[name], db);
        } else {
            return null;
        }
    }

    /**
     * param(key)
     * return the parameter value specified by the provided key
     * @param {string} key
     *        name of the req.param[key] value to return
     * @return {... || undefined}
     */
    param(key) {
        return this.data[key];
    }

    /**
     * tenantID()
     * return the tenantID of the current request
     * @return {string}
     */
    tenantID() {
        return this.tenantID;
    }
}

module.exports = function(req, controller) {
    return new ABRequest(req, controller);
};
