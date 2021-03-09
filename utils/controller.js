//
// Controller
// Define a common AppBuilder Controller class for use in our micro services.
//
var async = require("async");
const ABRequest = require("./reqService.js");
const cote = require("cote");

var fs = require("fs");
var path = require("path");
const prettyTime = require("pretty-time");
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

      this.serviceResponder = new cote.Responder({
         name: this.key,
         key: this.key,
      });

      this.config = config(this.key);
      this.connections = config("datastores");

      // scan our /handlers directory and load the handlers
      // into this.handlers
      this.handlers = [];
      var pathHandlers = path.join(process.cwd(), "handlers");
      if (fs.existsSync(pathHandlers)) {
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
      }

      // scan our [ /models, /models/shared ] directories and load our model
      // definitions into this.models
      var ignoreFiles = [".DS_Store", ".gitkeep"];
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
      var conn = AB.dbConnection(AB, false);
      if (conn) {
         conn.end();
      }
   }

   /**
    * startup
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
                  req: req,
                  stack: err2.stack,
               });
               return;
            }

            // check for input validations:
            if (handler.inputValidation) {
               var errors = abReq.validateData(handler.inputValidation);
               if (errors) {
                  cb({
                     message: "Invalid Inputs",
                     code: "EINVALIDINPUTS",
                     req: req,
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
               cb(cbErr, data);
            });
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
}

module.exports = function controller(...params) {
   return new ABServiceController(...params);
};
