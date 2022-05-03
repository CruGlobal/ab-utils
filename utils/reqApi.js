/*
 * reqApi
 * prepare a default set of data/utilities for our api request.
 * This request is established in the Sails api_sails service and is used
 * to verify and send jobs to various micro services.
 */
const shortid = require("shortid");
// const cote = require("cote");

const ABNotification = require("./reqNotification.js");
const ABPerformance = require("./reqPerformance.js");
const ABServicePublish = require("./reqServicePublish.js");
const ABServiceRequest = require("./serviceRequest.js");
const ABServiceResponder = require("./reqServiceResponder.js");
const ABServiceSubscriber = require("./reqServiceSubscriber.js");
const ABValidator = require("./reqValidation.js");

class ABRequestAPI {
   constructor(req, res, config = {}) {
      this.jobID = shortid.generate();
      // {string}
      // the unique id of this job.  It helps track actions for a particular
      // Job across service calls.

      this._tenantID = "??";
      // {string}
      // which tenant is this request for.

      this._user = null;
      // {json}
      // the SiteUser entry for the user making this request.

      this.serviceKey = "api_sails";
      // {string}
      // a unique string to identify this service for our service calls.
      // since ABRequestAPI is created on the api_sails service, we can
      // fix that value here.

      // expose the performance operator directly:
      this.performance = ABPerformance(this);

      // expose these for Unit Testing  & mocking:
      this.__req = req;
      this.__res = res;
      this.__console = console;
      this.__Notification = ABNotification(this);
      this.__Publisher = ABServicePublish(this);
      this.__Requester = ABServiceRequest(this);
      this.__Responder = ABServiceResponder; // Not an instance
      this.__Subscriber = ABServiceSubscriber; // Not an instance
      this.__Validator = ABValidator(this);

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
         if ((config || {}).verbose) {
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
   }

   get tenantID() {
      return this._tenantID;
   }

   set tenantID(id) {
      this._tenantID = id;
   }

   get user() {
      return this._user;
   }

   set user(u) {
      this._user = u;
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
         languageCode: this._user ? this._user.languageCode : false || "en",
         username: this._user ? this._user.username : false || "_system_",
      };
   }

   /**
    * tenantSet()
    * returns {bool} value if the tenantID is set.
    * @retun {bool}
    */
   tenantSet() {
      return this.tenantID != "??";
   }

   /**
    * log()
    * format our output logs to include our jobID with our message.
    */
   log(...allArgs) {
      var args = [];
      allArgs.forEach((a) => {
         args.push(JSON.stringify(a));
      });
      this.__console.log(`${this.jobID}::${args.join(" ")}`);
   }

   notify(domain, error, info) {
      this.__Notification.notify(domain, error, info);
   }

   /**
    * param()
    * An interface to return the requested input value.
    * If that value has already been processed by our .validateParameters()
    * we pull that value from there.  Otherwise we ask the provided req object
    * for the value.
    * @param {string} key
    *       The identifying parameter key
    * @return {string}
    */
   param(key) {
      // return the requested parameter key:

      var value = this.__Validator.param(key);
      if (typeof value == "undefined") {
         value = this.__req.param(key);
      }
      return value;
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
    * serviceResponder()
    * Create a Cote service responder that can parse our data interchange
    * format.
    * @param {string} key
    *        the service handler's key we are responding to.
    * @param {fn} handler
    *        a function to handle the incoming request. The function will
    *        receive 2 parameters: fn(req, cb)
    *          req: an instance of the ABRequest appropriate for the current
    *               context.
    *          cb:  a node.js style callback(err, result) for responding to
    *               the requester.
    */
   serviceResponder(key, handler) {
      return this.__Responder(key, handler, this);
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
    * @method validateParameters()
    * parse the {description} object and determine if the current req
    * instance passes the tests provided.
    *
    * This fn() will first use the {description} to build a joi
    * validator, and then evaluate the parameters using it.
    *
    * Any missed validation rules will be stored internally and an
    * error can be retrieved using .errorValidation().
    *
    * This fn() returns {true} if all checks pass, or {false} otherwise.
    * @param {hash} description
    *        An object hash describing the validation checks to use. At
    *        the top level the Hash is: { [paramName] : {ruleHash} }
    *        Each {ruleHash} follows this format:
    *        "parameterName" : {
    *           {joi.fn}  : true,  // performs: joi.{fn}();
    *            {joi.fn} : {
    *              {joi.fn1} : true,   // performs: joi.{fn}().{fn1}();
    *              {joi.fn2} : { options } // performs: joi.{fn}().{fn2}({options})
    *            }
    *            // examples:
    *            "required" : {bool},  // default = false
    *
    *            // custom:
    *            "validate" : {fn} a function(value, {allValues hash}) that
    *                           returns { error:{null || {new Error("Error Message")} }, value: {normalize(value)}}
    *         }
    *
    * @param {bool} autoRespond
    *        if {true} will auto respond on errors with the {res} object.
    * @param {hash} allParams
    *        if you want to limit the parameters .validateParameters()
    *        evaluates, then pass in the values as a { "param" : {value} }
    *        hash.
    *        if not provided, then we use the req.allParams() to retrieve
    *        the parameters to evaluate.
    * @return {bool}
    *
    **/
   validateParameters(description = {}, autoRespond = true, allParams) {
      allParams = allParams || this.__req.allParams();

      this.__Validator.validate(description, allParams);

      var validationError = this.__Validator.errors();
      if (validationError) {
         if (autoRespond) {
            if (this.__res && this.__res.ab && this.__res.ab.error) {
               this.__res.ab.error(validationError);
            } else {
               console.error(validationError);
            }
         }
         return false;
      }
      return true;
   }

   validationReset() {
      console.error("DEPRECIATED: ?? who is calling this?");
      this.__Validator.reset();
   }

   /**
    * @method validRoles()
    * Verify if the current user has one of the provided roleIDs assigned.
    * @param {array} roleIDs
    *        the {uuid} of the roles we are verifying.
    * @return {bool}
    */
   validRoles(roleIDs) {
      if (this._user && this._user.SITE_ROLE) {
         var found = this._user.SITE_ROLE.filter(
            (r) => roleIDs.indexOf(r.uuid) > -1
         );
         if (found.length > 0) {
            return true;
         }
      }
      return false;
   }

   /**
    * @method validBuilder()
    * Verify if the current user has one of the default Builder Roles assigned
    * @param {bool} autoRespond
    *        do we auto res.ab.error() on a negative result
    *        see validUser() method.
    * @return {bool}
    */
   validBuilder(autoRespond = true) {
      // these are the default Builder & System Designer Roles:
      if (
         !this.validRoles([
            "6cc04894-a61b-4fb5-b3e5-b8c3f78bd331",
            "e1be4d22-1d00-4c34-b205-ef84b8334b19",
         ])
      ) {
         if (autoRespond) {
            var err = new Error("Forbidden.");
            err.id = 6;
            err.code = "E_NOPERM";

            // use our {resAPI} error handler to return the error
            if (this.__res.ab.error) {
               this.__res.ab.error(err, 403);
            } else {
               this.log(err);
            }
         }
         return false;
      }
      return true;
   }

   /**
    * @method validUser()
    * returns {true} if there is a valid .user set on the request
    * or {false} if not.
    *
    * By default, this function will return a "E_REAUTH" error back
    * as the response.  If you want to externally handle this situation
    * then need to pass {false} for autoRespond.
    *
    * @param {bool} autoRespond
    *        if {true} will auto respond on errors with the {res} object.
    * @return {bool}
    **/
   validUser(autoRespond = true) {
      if (!this._user) {
         if (autoRespond) {
            var err = new Error("Reauthenticate.");
            err.id = 5; // v1/legacy value
            err.code = "E_REAUTH";

            // use our {resAPI} error handler to return the error
            if (this.__res && this.__res.ab && this.__res.ab.error) {
               this.__res.ab.error(err);
            } else {
               this.log(err);
            }
         }
         return false;
      }
      return true;
   }
}

module.exports = function (...params) {
   return new ABRequestAPI(...params);
};
