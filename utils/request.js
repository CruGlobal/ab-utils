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
        console.log("ABRequest():", req);
        this.jobID = req.jobID || "??";
        this.tenantID = req.tenantID || "??";
        this.data = req.data;
        this.controller = controller;
    }

    config() {
        return this.controller.config;
    }

    configDB() {
        return this.controller.connections;
    }

    dbConnection() {
        return DBConn(this);
    }

    log(...allArgs) {
        var args = [];
        allArgs.forEach((a) => {
            args.push(JSON.stringify(a));
        });
        console.log(`${this.jobID}::${args.join(" ")}`);
    }

    model(name) {
        if (this.controller.models[name]) {
            var db = this.dbConnection();
            return new Model(this.controller.models[name], db);
        } else {
            return null;
        }
    }

    tenantID() {
        return this.tenantID;
    }
}

module.exports = function(req, controller) {
    return new ABRequest(req, controller);
};
