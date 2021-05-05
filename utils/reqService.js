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
const ABPerformance = require("./reqPerformance.js");
const ABNotification = require("./reqNotification.js");
const ServicePublish = require("./reqServicePublish.js");
const ServiceRequest = require("./serviceRequest.js");
const ServiceSubscriber = require("./reqServiceSubscriber.js");
const { serializeError /*, deserializeError */ } = require("serialize-error");
const ABValidator = require("./reqValidation.js");

/**
 * @function deCircular()
 * perform a Depth First Search of the given object, and attempt to stringify
 * it for our logs.  This method is used when we detect a "circular" reference
 * in data we are trying to JSON.stringify() and we then attempt to parse the
 * values and convert any of our ABObjects into their .toObj() values to
 * prevent the circular references.
 * @param {array} args
 *        The array of text to display in our data dump.  Each row is another
 *        line of data to display.
 * @param {object} o
 *        The provided object we are parsing.
 * @param {string} context
 *        The display context of the object we are trying to display.
 */
function deCircular(args, o, context) {
   // Attempt to De-Circular our ABObject data
   for (var k in o) {
      if (null === o[k]) {
         args.push(`${context ? context : ""}${context ? "." : ""}${k}: null`);
      } else if ("object" === typeof o[k]) {
         if (o[k] && o[k].toObj) {
            args.push(
               `${context ? context : ""}${
                  context ? "." : ""
               }${k}: ${JSON.stringify(o[k].toObj())}`
            );
         } else {
            deCircular(args, o[k], (context ? context + "->" : "") + k);
         }
      } else {
         args.push(
            `${context ? context : ""}${context ? "." : ""}${k}: ${o[k]}`
         );
      }
   }
}

class ABRequestService {
   constructor(req, controller) {
      // console.log("ABRequest():", req);
      this.jobID = req.jobID || "??";
      // {string}
      // the unique id of this job.  It helps track actions for a particular
      // Job across service calls.

      this._tenantID = req.tenantID || "??";
      // {string}
      // which tenant is this request for.

      this._user = req.user || null;
      // {json}
      // the SiteUser entry for the user making this request.

      this.serviceKey = controller.key || this.jobID;
      // {string}
      // a unique string to identify this service for our service calls.

      // expose the performance operator directly:
      this.performance = ABPerformance(this);

      this.data = req.data || req.param;
      // {json}
      // the incoming job data provided by the calling service.

      this.controller = controller;

      // To allow unit test mocking:
      this._DBConn = DBConn;
      this._Model = Model;

      this.debug = false;

      // extend

      /**
       * @method req.log.verbose()
       * A shortcut method for logging "verbose" messages. There needs to be
       * a .verbose = true  in the config.local entry for the current service
       * in order for these messages to be displayed.
       *
       * Now get ready to eat up all kinds of disk space with needless
       * information to the console!
       */
      this.log.verbose = (...params) => {
         if ((this.config() || {}).verbose) {
            this.log(...params);
         }
      };

      /**
       * @method req.notifiy.builder()
       * A shortcut method for notifying builders of configuration errors.
       */
      this.notify.builder = (...params) => {
         this.notify("builder", ...params);
      };

      /**
       * @method req.notifiy.developer()
       * A shortcut method for notifying developer of operational errors.
       */
      this.notify.developer = (...params) => {
         this.notify("developer", ...params);
      };

      /**
       * @method req.broadcast.inboxCreate()
       * A shortcut method for posting our "ab.inbox.create"
       * messages to our Clients.
       * @param {array[SiteUser.uuid]} users
       *        An array of SiteUser.uuid(s) that should receive this message.
       *        Can also work with [{SiteUser}] objects.
       * @param {array[Role]} roles
       *        An array of Role.uuid(s) that should receive this message.
       *        Can also work with [{Role}] objects.
       * @param {obj} item
       *        The newly created Inbox Item definition.
       * @param {fn} cb
       *        (optional) for legacy code api, a node style callback(error)
       *        can be provided for the response.
       * @return {Promise}
       */
      this.broadcast.inboxCreate = (users, roles, item, cb) => {
         return new Promise((resolve, reject) => {
            var key = "broadcast.inbox.create";
            this.performance.mark(key);
            var packets = [];
            (users || []).forEach((u) => {
               packets.push({
                  room: this.socketKey(u.uuid || u.username || u),
                  event: "ab.inbox.create",
                  data: item,
               });
            });
            (roles || []).forEach((r) => {
               packets.push({
                  room: this.socketKey(r.uuid || r),
                  event: "ab.inbox.create",
                  data: item,
               });
            });
            this.broadcast(packets, (err) => {
               this.performance.measure(key);
               if (cb) {
                  cb(err);
               }
               if (err) {
                  reject(err);
                  return;
               }
               resolve();
            });
         });
      };

      /**
       * @method req.broadcast.dcCreate()
       * A shortcut method for posting our "ab.datacollection.create"
       * messages to our Clients.
       * @param {string} id
       *       The {ABObject.id} of the ABObject definition that we are going
       *       to post an update for. The incoming newItem should be data
       *       managed by this ABObject.
       * @param {obj} newItem
       *       The row data of the new Item that was created. Usually
       *       fully populated so the clients can work with them as usual.
       * @param {string} key
       *       (optional) a specific internal performance marker key
       *       for tracking how long this broadcast operation took.
       * @param {fn} cb
       *       (optional) for legacy code api, a node style callback(error)
       *       can be provided for the response.
       * @return {Promise}
       */
      this.broadcast.dcCreate = (id, newItem, key, cb) => {
         return new Promise((resolve, reject) => {
            key = key || "broadcast.dc.create." + id;
            this.performance.mark(key);
            this.broadcast(
               [
                  {
                     room: this.socketKey(id),
                     event: "ab.datacollection.create",
                     data: {
                        objectId: id,
                        data: newItem,
                     },
                  },
               ],
               (err) => {
                  this.performance.measure(key);
                  if (cb) {
                     cb(err);
                  }
                  if (err) {
                     reject(err);
                     return;
                  }
                  resolve();
               }
            );
         });
      };

      /**
       * @method req.broadcast.dcDelete()
       * A shortcut method for posting our "ab.datacollection.delete"
       * messages to our Clients.
       * @param {string:uuid} id
       *       The {ABObject.id} of the ABObject definition that we are going
       *       to post a delete for. The deleted item should be data
       *       managed by this ABObject.
       * @param {string:uuid} itemID
       *       The uuid of the row being deleted..
       * @param {string} key
       *       (optional) a specific internal performance marker key
       *       for tracking how long this broadcast operation took.
       * @param {fn} cb
       *       (optional) for legacy code api, a node style callback(error)
       *       can be provided for the response.
       * @return {Promise}
       */
      this.broadcast.dcDelete = (id, itemID, key, cb) => {
         return new Promise((resolve, reject) => {
            key = key || "broadcast.dc.delete." + id;
            this.performance.mark(key);
            this.broadcast(
               [
                  {
                     room: this.socketKey(id),
                     event: "ab.datacollection.delete",
                     data: {
                        objectId: id,
                        data: itemID,
                     },
                  },
               ],
               (err) => {
                  this.performance.measure(key);
                  if (cb) {
                     cb(err);
                  }
                  if (err) {
                     reject(err);
                     return;
                  }
                  resolve();
               }
            );
         });
      };

      /**
       * @method req.broadcast.dcUpdate()
       * A shortcut method for posting our "ab.datacollection.update"
       * messages to our Clients.
       * @param {string} id
       *       The {ABObject.id} of the ABObject definition that we are going
       *       to post an update for. The incoming newItem should be data
       *       managed by this ABObject.
       * @param {obj} updatedItem
       *       The row data of the new Item that was updated. Can be fully
       *       populated, or just the updated values.
       * @param {string} key
       *       (optional) a specific internal performance marker key
       *       for tracking how long this broadcast operation took.
       * @param {fn} cb
       *       (optional) for legacy code api, a node style callback(error)
       *       can be provided for the response.
       * @return {Promise}
       */
      this.broadcast.dcUpdate = (id, updatedItem, key, cb) => {
         return new Promise((resolve, reject) => {
            key = key || "broadcast.dc.update." + id;
            this.performance.mark(key);
            this.broadcast(
               [
                  {
                     room: this.socketKey(id),
                     event: "ab.datacollection.update",
                     data: {
                        objectId: id,
                        data: updatedItem,
                     },
                  },
               ],
               (err) => {
                  this.performance.measure(key);
                  if (cb) {
                     cb(err);
                  }

                  if (err) {
                     reject(err);
                     return;
                  }
                  resolve();
               }
            );
         });
      };

      // expose this for Unit Testing & Mocking
      this.__Notification = ABNotification(this);
      this.__Publisher = ServicePublish(this);
      this.__Requester = ServiceRequest(this);
      this.__Subscriber = ServiceSubscriber; // Not an instance
      this.__Validator = ABValidator(this);
   }

   /**
    * @method req.broadcast()
    * An interface for communicating real time data updates to our clients.
    * @param {array} packets
    *       An array of broadcast packets to post to our clients.  Each
    *       packet has the following information:
    *       .room: {string} A unique identifier of the group of clients
    *              to receive the notifications.  Usually this is a
    *              multi-tenant identified id, generated by:
    *              req.socketKey(id)
    *       .event: {string} a unique "key" that tells the client what data
    *              they are receiving.
    *       .data: {json} the data delivery for the .event
    *
    * @param {fn} cb
    *       a node style callback(error, results) can be provided to notify
    *       when the packet has been sent.
    */
   broadcast(packets, cb) {
      this.serviceRequest("api.broadcast", packets, (err, results) => {
         if (err) {
            this.log("Error with api.broadcast", err);
            this.notify.developer(err, {
               tenantID: this._tenantID,
               jobID: this.jobID,
            });
         }
         if (cb) {
            cb(err, results);
         }
      });
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
      if (this._tenantID != "??") {
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

   connections() {
      return this.controller.connections;
   }

   /**
    * dbConnection()
    * return a connection to our mysql DB for the current request:
    * @param {bool} create
    *        create a new DB connection if we are not currently connected.
    * @return {Mysql.conn || null}
    */
   dbConnection(create = true) {
      return this._DBConn(this, create);
   }

   /**
    * languageCode()
    * return the current language settings for this request.
    * @return {string}
    */
   languageCode() {
      if (this._user && this._user.languageCode) {
         return this._user.languageCode;
      }
      this.log("no language code set for ABRequest._user: defaulting to 'en'");
      return "en";
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
         try {
            args.push(JSON.stringify(a));
         } catch (e) {
            if (e.toString().indexOf("circular") > -1) {
               // var errStack = new Error(
               //    ">>>>>  Fix Circular reference sent to log(): "
               // );
               // this.notify.developer(errStack, {
               //    context: "reqService.log(): circular reference detected",
               // });

               deCircular(args, a);
            } else {
               throw e; // What was this error?
            }
         }
      });
      console.log(`${this.jobID}::${args.join(" ")}`);
   }

   /**
    * logError()
    * print out a log entry for the current request
    * @param {...} allArgs
    *        array of possible log entries
    */
   logError(message, err) {
      this.log(message, serializeError(err));
      if (err._context) {
         this.log(err._context);
      }
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
         var newModel = new this._Model(this.controller.models[name], db, this);
         newModel._key = name;
         return newModel;
      } else {
         return null;
      }
   }

   notify(domain, error, info) {
      this.__Notification.notify(domain, error, info);
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

   allParams(...params) {
      return this.params(...params);
   }

   params(ignoreList = []) {
      var result = {};
      (Object.keys(this.data) || []).forEach((k) => {
         if (ignoreList.indexOf(k) == -1) {
            result[k] = this.param(k);
         }
      });
      return result;
   }

   /**
    * query()
    * perform an sql query directly on our dbConn.
    * @param {string} query
    *        the sql query to perform.  Use "?" for placeholders.
    * @param {array} values
    *        the array of values that correspond to the placeholders in the sql
    * @param {fn} cb
    *        a node style callback with 3 paramaters (error, results, fields)
    *        these are the same values as returned by the mysql library .query()
    * @param {int} numRetries
    *        the number of times this query has been attempted. (default: 0)
    * @param {obj} prev
    *        the previous value of our .query() attempt if this is a retry.
    *        these previous values will be sent on if we have too many retries.
    */
   query(query, values, cb, numRetries = 0, prev = null) {
      if (numRetries > 3) {
         cb(prev.error, prev.results, prev.fields);
         return;
      }

      var q = this.dbConnection().query(
         query,
         values,
         (error, results, fields) => {
            // error will be an Error if one occurred during the query
            // results will contain the results of the query
            // fields will contain information about the returned results fields (if any)

            if (this.debug) {
               this.log("req.query():", q.sql);
            }

            if (error) {
               if (
                  error
                     .toString()
                     .indexOf("PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR") > -1
               ) {
                  console.log(error);
                  console.log("trying again");
                  this.query(query, values, cb, numRetries + 1, {
                     error,
                     results,
                     fields,
                  });
                  return;
               }
               error.sql = q.sql;
            }
            cb(error, results, fields);
         }
      );
      // console.log("req.query():", q.sql);
   }

   /**
    * queryTenantDB()
    * return the tenantDB value for this req object.
    * this is a helper function that simplifies the error handling if no
    * tenantDB is found.
    * @param {Promise.reject} reject
    *        a reject() handler to be called if a tenantDB is not found.
    * @return {false|string}
    *        false : if not tenantDB is found
    *        string: the tenantDB name.
    */
   queryTenantDB(reject) {
      let tenantDB = this.tenantDB();
      if (tenantDB == "") {
         let errorNoTenant = new Error(
            `Unable to find tenant information for tenantID[${this.tenantID()}]`
         );
         errorNoTenant.code = "ENOTENANT";
         reject(errorNoTenant);
         return false;
      }
      return tenantDB;
   }

   /**
    * queryWhereCondition(cond)
    * evaluate a given {cond} hash and generate an SQL condition string
    * from it.
    * This fn() returns both the sql condition string, and an array of
    * values that correspond to the proper ordering of the condition
    * @param {obj} cond
    *        a value hash of the desired condition.
    * @return { condition, values}
    *        condition {string} the proper sql "WHERE ${condition}"
    *        values {array} the values to fill in the condition placeholders
    */
   queryWhereCondition(cond) {
      var values = [];
      var condition = "";
      if (cond) {
         var params = [];
         Object.keys(cond).forEach((key) => {
            values.push(cond[key]);
            if (Array.isArray(cond[key])) {
               if (cond[key].length > 0) {
                  params.push(`${key} IN ( ? )`);
               } else {
                  // if an empty array then we falsify this condition:
                  values.pop(); // remove pushed value above
                  params.push(` 1 = 0 `);
               }
            } else {
               params.push(`${key} = ?`);
            }
         });
         condition = `${params.join(" AND ")}`;
      }

      return { condition, values };
   }

   /**
    * @method retry()
    * Attempt to retry the provided fn() if it results in an interrupted
    * Network operation error.
    *
    * The provided fn() needs to return a {Promise} that resolves() with
    * the expected return data, and rejects() with the Network errors.
    *
    * @param {fn} fn
    *        The promise based network operation
    * @return {Promise}
    */
   retry(fn) {
      var reTryErrors = ["ECONNRESET", "ETIMEDOUT"];
      return fn().catch((error) => {
         // retry on a connection reset
         var strErr = error.toString();
         var isRetry = false;
         var msg = "";
         reTryErrors.forEach((e) => {
            if (strErr.indexOf(e) > -1) {
               isRetry = true;
               msg = `... received ${e}, retrying`;
            }
         });
         if (isRetry) {
            this.log(msg);
            return this.retry(fn);
         }

         // propogate the error
         throw error;
      });
   }

   /**
    * servicePublish()
    * Publish an update to other subscribed services.
    * @param {string} key
    *        the channel we are updating.
    * @param {json} data
    *        the data packet to send to the subscribers.
    * @param {fn} cb
    *        a node.js style callback(err, result) for when the response
    *        is received.
    */
   servicePublish(key, data) {
      this.__Publisher.publish(key, data);
   }

   /**
    * serviceRequest()
    * Send a request to another micro-service using the cote protocol.
    * @param {string} key
    *        the service handler's key we are sending a request to.
    * @param {json} data
    *        the data packet to send to the service.
    * @param {fn} cb
    *        a node.js style callback(err, result) for when the response
    *        is received.
    */
   serviceRequest(key, data, cb) {
      this.__Requester.request(key, data, cb);
   }

   /**
    * serviceSubscribe()
    * Create a Cote service subscriber that can parse our data interchange
    * format.
    * @param {string} key
    *        the service handler's key we are responding to.
    * @param {fn} handler
    *        a function to handle the incoming request. The function will
    *        receive 1 parameters: fn(req)
    *          req: an instance of the ABRequest appropriate for the current
    *               context.
    */
   serviceSubscribe(key, handler) {
      return this.__Subscriber(key, handler, this);
   }

   /**
    * socketKey()
    * make sure any socket related key is prefixed by our tenantID
    * @param {string} key
    *       The socket key we are wanting to reference.
    * @return {string}
    */
   socketKey(key) {
      return `${this._tenantID}-${key}`;
   }

   /**
    * tenantDB()
    * return the database reference for the current Tenant
    * @return {string}
    */
   tenantDB() {
      let tenantID = this.tenantID();
      let config = this.config();
      let tenantDB = "";
      if (tenantID && !config.site_only) {
         var connSettings = this.configDB();
         if (connSettings && connSettings.database) {
            let dbConn = this.dbConnection();
            tenantDB = dbConn.escapeId(`${connSettings.database}-${tenantID}`);
         }
      }

      return tenantDB;
   }

   /**
    * tenantID()
    * return the tenantID of the current request
    * @return {string}
    */
   tenantID() {
      if (this._tenantID == "??") {
         return null;
      }
      return this._tenantID;
   }

   toABFactoryReq() {
      var ABReq = new ABRequestService(
         {
            jobID: `ABFactory(${this._tenantID})`,
            tenantID: this._tenantID,
         },
         this.controller
      );
      ABReq._DBConn = this._DBConn;
      ABReq._Model = this._Model;
      return ABReq;
   }

   /**
    * @method toObj()
    * return a simplified {obj} hash of this request's data.
    * @return {obj}
    */
   toObj() {
      var obj = {};
      ["jobID", "_tenantID", "_user", "serviceKey"].forEach((f) => {
         obj[f] = this[f];
      });
      return obj;
   }

   /**
    * @method userDefaults()
    * return a data structure used by our ABModel.find() .create() .update()
    * .delete() operations that needs credentials for the current User
    * driving this request.
    * @return {obj}
    *          .languageCode: {string} the default language code of the user
    *          .usernam: {string} the .username of the user for Identification.
    */
   userDefaults() {
      return {
         languageCode: this.languageCode(),
         username: this.username(),
      };
   }

   username() {
      if (this._user && this._user.username) {
         return this._user.username;
      }
      return "_system_";
   }

   validateData(description) {
      this.__Validator.validate(description, this.data);
      return this.__Validator.errors();
   }
}

module.exports = function (...params) {
   return new ABRequestService(...params);
};
