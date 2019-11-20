//
// Controller
// Define a common AppBuilder Controller class for use in our micro services.
//
var async = require("async");
const ABRequest = require("./request.js");
const cote = require("cote");

var fs = require("fs");
var path = require("path");
// var _ = require("lodash");
var EventEmitter = require("events").EventEmitter;
const config = require(path.join(__dirname, "config.js"));

class ABServiceController extends EventEmitter {
    constructor(key) {
        super();

        this.key = key || "ABServiceController";

        this._beforeStartup = [];
        this._afterStartup = [];
        this._beforeShutdown = [];
        this._afterShutdown = [];

        this.serviceResponder = new cote.Responder({ name: this.key });

        this.config = config(this.key);
        this.connections = config("datastores");

        // scan our /handlers directory and load the handlers
        // into this.handlers
        this.handlers = [];
        var pathHandlers = path.join(process.cwd(), "handlers");
        var files = fs.readdirSync(pathHandlers);
        files.forEach((fileName) => {
            try {
                var handler = require(path.join(pathHandlers, fileName));
                if (handler.key && handler.fn) {
                    // this looks like a handler:
                    this.handlers.push(handler);
                }
            } catch (e) {
                console.log("::", e);
            }
        });

        // scan our /models directory and load our model definitions
        // into this.models
        this.models = {};
        var pathModels = path.join(process.cwd(), "models");
        var modelDefinitions = fs.readdirSync(pathModels);
        modelDefinitions.forEach((fileName) => {
            try {
                var model = require(path.join(pathHandlers, fileName));
                var parsed = path.parse(fileName);
                this.models[parsed.name] = model;
            } catch (e) {
                console.log("::", e);
            }
        });

        // setup our process listeners:
        process.on("SIGINT", () => {
            console.info("SIGINT signal received.");
            this.exit();
        });

        process.on("SIGTERM", () => {
            console.info("SIGTERM signal received.");
            this.exit();
        });
    }

    /**
     * exit
     * exit this service.
     */
    exit() {
        return Promise.resolve()
            .then(() => {
                return new Promise((resolve, reject) => {
                    async.series(this._beforeShutdown, (err) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });
            })
            .then(() => {
                return this.shutdown();
            })
            .then(() => {
                return new Promise((resolve, reject) => {
                    async.series(this._afterShutdown, (err) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });
            })
            .then(() => {
                process.exit(0);
            });
    }

    /**
     * init
     * begin this service.
     */
    init() {
        return Promise.resolve()
            .then(() => {
                return new Promise((resolve, reject) => {
                    async.series(this._beforeStartup, (err) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });
            })
            .then(() => {
                return this.startup();
            })
            .then(() => {
                return new Promise((resolve, reject) => {
                    async.series(this._afterStartup, (err) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });
            })
            .then(() => {
                this.ready();
            });
    }

    afterShutdown(fn) {
        if (fn) {
            this._afterShutdown.push(fn);
        }
    }

    afterStartup(fn) {
        if (fn) {
            this._afterStartup.push(fn);
        }
    }

    beforeShutdown(fn) {
        if (fn) {
            this._beforeShutdown.push(fn);
        }
    }

    beforeStartup(fn) {
        if (fn) {
            this._beforeStartup.push(fn);
        }
    }

    /**
     * ready
     * Send a 'ready' signal on this process. Useful for service managers
     * (like pm2) to know the process is ready.
     */
    ready() {
        if (process.send) {
            process.send("ready");
        }
    }

    /**
     * shutdown
     * the process a service should perform to gracefully shutdown.
     */
    shutdown() {
        this.handlers.forEach((handler) => {
            this.serviceResponder.off(handler.key, handler._cFN);
        });

        // make sure we close down our db connection.
        var AB = ABRequest({}, this);
        AB.dbConnection().end();
    }

    /**
     * startup
     * the process a service should perform to startup.
     */
    startup() {
        // initialize each service handler
        this.handlers.forEach((handler) => {
            handler._cFN = (req, cb) => {
                var abReq = ABRequest(req, this);

                handler.fn(abReq, cb);
            };
            this.serviceResponder.on(handler.key, handler._cFN);
        });

        // now request a db connection just to get things
        // initially connected.
        var AB = ABRequest({}, this);
        AB.dbConnection();
    }
}

module.exports = function controller(key) {
    return new ABServiceController(key);
};
