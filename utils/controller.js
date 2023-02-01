/**
 * Define a common AppBuilder Controller class for use in our micro services.
 * @module Controller
 * @ignore
 */
const async = require("async");
const ABRequest = require("./reqService.js");
const cote = require("cote");

const fs = require("fs");
const Mysql = require("mysql");
const path = require("path");
const prettyTime = require("pretty-time");

const redis = require("redis");

// var _ = require("lodash");
const EventEmitter = require("events").EventEmitter;
const config = require(path.join(__dirname, "config.js"));

const _PendingRequests = {
   /* requestID: cb() */
};
// the incoming requests by their requestID.
// It is possible timeouts will happen, and the calling request will be repeated.
// Instead of passing it to the handler to be run again, we update our stored cb
// with the new one, so that the latest cb() is called when the handler is
// resolved.

/**
 * @alias ABServiceController
 * @extends EventEmitter
 * @typicalname controller
 * @param {string} [key=ABServiceController] key to identify the contoller
 */
class ABServiceController extends EventEmitter {
   constructor(key) {
      super();

      this.key = key || "ABServiceController";

      this._beforeStartup = [];
      this._afterStartup = [];
      this._beforeShutdown = [];
      this._afterShutdown = [];

      // this.config = config(this.key);
      // this.connections = config("datastores");

      this.waitForDB = false;
      // {bool} wait for DB service to be ready before continuing our .init()

      var ignoreFiles = [".DS_Store", ".gitkeep"];

      // scan our /handlers directory and load the handlers
      // into this.handlers
      this.handlers = [];
      var pathHandlers = path.join(process.cwd(), "handlers");
      if (fs.existsSync(pathHandlers)) {
         var files = fs.readdirSync(pathHandlers);
         files.forEach((fileName) => {
            if (ignoreFiles.indexOf(fileName) == -1) {
               try {
                  var handler = require(path.join(pathHandlers, fileName));
                  if (handler.key && handler.fn) {
                     // this looks like a handler:
                     this.handlers.push(handler);
                  }
               } catch (e) {
                  console.log("::", e);
               }
            }
         });
      }

      // scan our [ /models, /models/shared ] directories and load our model
      // definitions into this.models
      this.models = {};
      this.haveModels = false;
      var includeModels = (pathModels) => {
         if (fs.existsSync(pathModels)) {
            var modelDefinitions = fs.readdirSync(pathModels);
            modelDefinitions.forEach((fileName) => {
               if (ignoreFiles.indexOf(fileName) == -1) {
                  try {
                     var model = require(path.join(pathModels, fileName));
                     var parsed = path.parse(fileName);
                     this.models[parsed.name] = model;
                     this.haveModels = true;
                  } catch (e) {
                     console.log(
                        `Error loading model[${pathModels}][${fileName}]:`
                     );
                     console.log("::", e);
                  }
               }
            });
         }
      };
      includeModels(path.join(process.cwd(), "models"));
      includeModels(path.join(__dirname, "..", "shared", "models"));

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
    * exit this service.
    * @returns {Promise}
    */
   exit() {
      return Promise.resolve()
         .then(() => {
            return new Promise((resolve, reject) => {
               var reqShutdown = ABRequest(
                  { jobID: `${this.key}.before_shutdown` },
                  this
               );
               var allFNs = [];
               this._beforeShutdown.forEach((f) => {
                  allFNs.push((cb) => {
                     f(reqShutdown, cb);
                  });
               });

               async.series(allFNs, (err) => {
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
    * begin this service.
    * @returns {Promise}
    */
   init() {
      var initState = "";
      // {string}
      // identifies the current step of our .init() process for use in
      // error identification.

      return Promise.resolve()
         .then(() => {
            initState = "1.wait_config_complete";
            // make sure the config service has completed:
            return this._waitForConfig().then(() => {
               this.config = config(this.key);
               this.connections = config("datastores");
            });
         })
         .then(() => {
            initState = "2.wait_redis_ready";
            // our cote connection will throw an error if it can't connect to
            // redis, so wait until we can establish a connection before
            // proceeding with our initialization.
            return this._waitForRedis().then(() => {
               this.serviceResponder = new cote.Responder({
                  name: this.key,
                  key: this.key,
                  port: 9000,
               });
            });
         })
         .then(() => {
            if (!this.waitForDB) {
               return Promise.resolve();
            }
            initState = "2.5.wait_DB_ready";
            // This service depends on the DB service to be ready before
            // continuing.
            return this._waitForDB();
         })
         .then(() => {
            initState = "3.process_before_startups";
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
            initState = "4.startups";
            return this.startup();
         })
         .then(() => {
            initState = "5.process_after_startups";
            return new Promise((resolve, reject) => {
               var reqStartup = ABRequest(
                  { jobID: `${this.key}.after_startup` },
                  this
               );
               var allStartups = [];
               this._afterStartup.forEach((f) => {
                  allStartups.push((cb) => {
                     f(reqStartup, cb);
                  });
               });
               async.series(allStartups, (err) => {
                  if (err) {
                     reject(err);
                  } else {
                     resolve();
                  }
               });
            });
         })
         .then(() => {
            initState = "6.controller.ready";
            this.ready();
         })
         .catch((err) => {
            var reqErrorStartup = ABRequest(
               { jobID: `${this.key}.error_startup` },
               this
            );
            reqErrorStartup.notify.developer(err, { initState });
         });
   }

   /**
    * @param {function} fn
    */
   afterShutdown(fn) {
      if (fn) {
         this._afterShutdown.push(fn);
      }
   }

   /**
    * @param {function} fn
    */
   afterStartup(fn) {
      if (fn) {
         this._afterStartup.push(fn);
      }
   }

   /**
    * @param {function} fn
    */
   beforeShutdown(fn) {
      if (fn) {
         this._beforeShutdown.push(fn);
      }
   }

   /**
    * @param {function} fn
    */
   beforeStartup(fn) {
      if (fn) {
         this._beforeStartup.push(fn);
      }
   }

   /**
    * Send a 'ready' signal on this process. Useful for service managers
    * (like pm2) to know the process is ready.
    */
   ready() {
      if (process.send) {
         process.send("ready");
      }
   }

   /**
    * return a new ABRequest() object.
    * @param {object} option any initial settings for the {@link ABRequestService} obj
    * @return {ABRequestService}
    */
   requestObj(options = {}) {
      return ABRequest(options, this);
   }

   /**
    * the process a service should perform to gracefully shutdown.
    */
   shutdown() {
      this.handlers.forEach((handler) => {
         if (handler._cFN) {
            this.serviceResponder.off(handler.key, handler._cFN);
         }
      });

      // make sure we close down our db connection.
      var AB = ABRequest({}, this);
      var conn = AB.dbConnection(AB, false);
      if (conn) {
         conn.end();
      }
   }

   /**
    * the process a service should perform to startup.
    */
   startup() {
      // initialize each service handler
      this.handlers.forEach((handler) => {
         handler._cFN = (req, cb) => {
            // ._cFN {function} our intermediate fn() for pre-processing the
            //       incoming service requests. After we do our thang, then
            //       we pass control onto the defined handler.fn()
            // @param {json} req
            //       the incoming raw data from cote request.  This is in our
            //       exchange format (defined in {serviceRequest}). we need
            //       to create an instance of {reqService} from this.
            // @param {fn} cb
            //       the callback(err, data) function provided by cote to
            //       resolve the request.

            var abReq = ABRequest(req.param, this);
            // {reqService}
            // This is the handler.fn(req, ...) object being passed into our
            // handlers.

            //
            // perform basic error checking here:
            //
            var config = abReq.config();

            // if config not set, we have not be initialized properly.
            if (!config) {
               abReq.log("WARN: handler not setup properly.");
               var err = new Error("Missing config");
               cb({
                  message: "Missing config",
                  code: "EMISSINGCONFIG",
                  req: req,
                  stack: err.stack,
               });
               return;
            }

            // check if we are enabled
            if (!config.enable) {
               // we shouldn't be getting notification.email messages
               abReq.log("WARN: job received, but config.enable is false.");
               var err2 = new Error("service is disabled.");
               cb({
                  message: "Service is disabled.",
                  code: "EDISABLED",
                  req: req.data,
                  stack: err2.stack,
               });
               return;
            }

            // check for input validations:
            if (handler.inputValidation) {
               var errors = abReq.validateData(handler.inputValidation);
               if (errors) {
                  cb({
                     service: handler.key || "??",
                     message: "Invalid Inputs",
                     code: "EINVALIDINPUTS",
                     req: req.data,
                     errors: errors,
                  });
                  return;
               }
               // for (var i in handler.inputValidation) {
               //    var value = abReq.param(i);

               //    var info = handler.inputValidation[i];
               //    if (info.required && !value) {
               //       errors.push({
               //          code: "EMISSINGPARAM",
               //          param: i,
               //          message: `${i} is required`,
               //       });
               //    }
               // }

               // if (errors.length > 0) {
               //    cb({
               //       message: "Invalid Inputs",
               //       code: "EINVALIDINPUTS",
               //       req: req,
               //       errors: errors,
               //    });
               //    return;
               // }
            }

            // check for duplicate Requests:
            if (_PendingRequests[abReq.requestID]) {
               // this is a duplicate:
               abReq.log("... preventing duplicate request");

               // update the stored cb()
               _PendingRequests[abReq.requestID] = cb;
               return;
            }

            // store the original cb for this requestID
            _PendingRequests[abReq.requestID] = cb;

            try {
               // so far so good, now pass on to handler:
               handler.fn(abReq, (err, data) => {
                  // do our own conditioning of the err data:
                  var cbErr = null;
                  if (err) {
                     cbErr = err;
                     if (err instanceof Error) {
                        cbErr = {
                           code: err.code,
                           message: err.toString(),
                           stack: err.stack,
                        };
                     }
                  }
                  abReq.performance.log();

                  // cb(cbErr, data);
                  // send back the data on the latest _PendingRequest
                  _PendingRequests[abReq.requestID](cbErr, data);
                  delete _PendingRequests[abReq.requestID];
               });
            } catch (e) {
               abReq.notify.developer(e, {
                  message: "unhandled Error in service handler",
                  req: abReq,
               });
               abReq.performance.log();

               // cb(cbErr, data);
               // send back the data on the latest _PendingRequest
               _PendingRequests[abReq.requestID](e);
               delete _PendingRequests[abReq.requestID];
            }
         };
         this.serviceResponder.on(handler.key, handler._cFN);
      });

      // if we have models defined request a db connection just to get things
      // initially connected.
      if (this.haveModels) {
         var AB = ABRequest({}, this);
         AB.dbConnection();
      }
   }

   /**
    * waits until the config service has posted a '.config_ready' file
    * @return {Promise}
    */
   _waitForConfig() {
      return new Promise((resolve /* , reject */) => {
         var delay = 500; // ms
         var countTimeout = 40;
         var count = 0;
         function waitConfig() {
            count++;
            fs.access("/app/config/.config_ready", fs.constants.F_OK, (err) => {
               if (err && count < countTimeout) {
                  setTimeout(waitConfig, delay);
                  return;
               }
               if (count >= countTimeout) {
                  console.log("... wait config timeout");
               } else {
                  console.log("... config ready");
               }
               resolve();
            });
         }
         setTimeout(waitConfig, delay);
      });
   }

   /**
    * attempts to connect to our maria DB service before continuing.
    * @return {Promise}
    */
   _waitForDB() {
      return new Promise((resolve /* , reject */) => {
         var reqWaitDB = ABRequest({ jobID: `${this.key}.wait_db` }, this);
         var dbConfig = reqWaitDB.configDB();

         tryConnect(dbConfig, () => {
            // now we can continue.
            resolve();
         });
      });
   }

   /**
    * attempts to connect to our redis server and then resolves() once the connection is ready.
    * @return {Promise}
    */
   _waitForRedis() {
      return new Promise((resolve /* , reject */) => {
         var client = redis.createClient({
            host: "redis",
            // port: <port>,
            // password: '<password>'

            retry_strategy: function (options) {
               // if (options.error && options.error.code === "ECONNREFUSED") {
               //    // End reconnecting on a specific error and flush all commands with
               //    // a individual error
               //    return new Error("The server refused the connection");
               // }
               // if (options.total_retry_time > 1000 * 60 * 60) {
               //    // End reconnecting after a specific timeout and flush all commands
               //    // with a individual error
               //    return new Error("Retry time exhausted");
               // }
               // if (options.attempt > 10) {
               //    // End reconnecting with built in error
               //    return undefined;
               // }

               // console.log("... waiting for redis attempt:" + options.attempt);
               // reconnect after
               return Math.min(options.attempt * 200, 3000);
            },
         });

         // client.on("error", (err) => {
         //    console.log("... waiting for redis");
         // });

         client.on("connect", () => {
            client.quit();
            resolve();
         });
      });
   }
}

/**
 * Get an AppBuilder Controller for use in our micro services
 * @param {string} [key=ABServiceController]
 * @returns {ABServiceController}
 */
module.exports = function controller(...params) {
   return new ABServiceController(...params);
};

/* --- Helper Functions --- */

/**
 * continue attempting to connect to our DB using our provided dbConfig
 * until we finally succeed.  Then we call our cb();
 * @param {json} dbConfig
 *        The mysql connection info
 * @param {fn} cb(err)
 *        A node style callback(err);
 *        Will be called once we successfully connect to mysql.
 * @param {int} count
 *        A counter so we don't output the "not ready" log so many times.
 */
function tryConnect(dbConfig, cb, count = 0) {
   // attempt connection:
   var DB = Mysql.createConnection(dbConfig);
   // DB.on("error", (err) => {
   //    console.log("DB.on(error):", err);

   //    setTimeout(() => {
   //       Connect(cb);
   //    }, 250);

   //    DB.destroy();
   // });
   DB.connect(function (err) {
      if (err) {
         if (count == 0) {
            console.log("mysql not ready ... waiting.");
         }
         if (count > 5) count = -1;

         setTimeout(() => {
            tryConnect(dbConfig, cb, count + 1);
         }, 500);
         return;
      }
      console.log("successful connection to mysql, continuing");
      DB.destroy();
      cb();
   });
}
