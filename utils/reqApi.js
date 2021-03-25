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
const ABServiceRequest = require("./serviceRequest.js");
const ABServiceResponder = require("./reqServiceResponder.js");
const ABValidator = require("./reqValidation.js");
/*
var Joi = null;
const NODE_MAJOR_VERSION = process.versions.node.split(".")[0];
if (NODE_MAJOR_VERSION >= 12) {
   Joi = require("joi");
}

var validators = {
   /* key : Joi.object() * /
};
*/

// var domainRequesters = {
//     domainKey : coteRequester
// };

class ABRequestAPI {
   constructor(req, res) {
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
      this.__Requester = ABServiceRequest(this);
      this.__Responder = ABServiceResponder;
      this.__Validator = ABValidator(this);
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
         languageCode: this._user.languageCode || "en",
         username: this._user.username || "_system_",
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
}

module.exports = function (...params) {
   return new ABRequestAPI(...params);
};
