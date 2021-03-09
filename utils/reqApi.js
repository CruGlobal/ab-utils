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
    * socketKey()
    * make sure any socket related key is prefixed by our tenantID
    * @param {string} key
    *       The socket key we are wanting to reference.
    * @return {string}
    */
   socketKey(key) {
      return `${this._tenantID}-${key}`;
   }
}

module.exports = function (...params) {
   return new ABRequestAPI(...params);
};

/*
// module.exports = function (req, res) {
//    var newREQ = {
      // jobID: shortid.generate(),
      // tenantID: "??",
      // user: null,
      // tenantSet: function () {
      //    return this.tenantID != "??";
      // },
      // log: function (...allArgs) {
      //    var args = [];
      //    allArgs.forEach((a) => {
      //       args.push(JSON.stringify(a));
      //    });
      //    this.__console.log(`${this.jobID}::${args.join(" ")}`);
      // },

      // param: function (key) {
      //    // return the requested parameter key:

      //    // if we have already done .validateParameters() then we might have
      //    // some normalized values processed.  Return those if we have 'em:
      //    if (
      //       this.__validationParamsNormalized &&
      //       typeof this.__validationParamsNormalized[key] != "undefined"
      //    ) {
      //       return this.__validationParamsNormalized[key];
      //    } else {
      //       // otherwise just return the raw value:
      //       return req.param(key);
      //    }
      // },

      // performance: {
      //    log: () => {
      //       var totalTime = process.hrtime(newREQ.__performance.start);

      //       Object.keys(newREQ.__performance).forEach((k) => {
      //          if (k != "start") {
      //             newREQ.log(`${k}: ${prettyTime(newREQ.__performance[k])}`);
      //          }
      //       });
      //       newREQ.log(`total time: ${prettyTime(totalTime)}`);
      //    },
      // },

      // toParam: function (key, data) {
      //    data = data || {};
      //    return {
      //       type: key,
      //       param: {
      //          jobID: this.jobID,
      //          tenantID: this.tenantID,
      //          user: this.user,
      //          data,
      //       },
      //    };
      // },

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
       */
// validateParameters: function (
//    description = {},
//    autoRespond = true,
//    allParams
// ) {
//    /*
//     * description = {
//     *   "field" : { type: "type", required: [true|false] }
//     * }
//     */
//    if (Joi) {
//       var key = JSON.stringify(description);
//       if (!validators[key]) {
//          // parse the description to create a Joi.object() validator:

//          var inputs = {};
//          // {hash} inputs
//          // final { "field": Joi.rules() } object:
//          // this will become the final validators[key] entry that
//          // processes our rules.

//          var setConstraints = [];
//          // some rules are applied to the final Joi.object()

//          var parseRules = (test, dKey, input, level = 1) => {
//             // Recursive fn() to parse the validation description.
//             // @test:  {Joi}  test runner
//             // @dKey:  {string} the current parameter name
//             // @input: {hash} the definition hash we are processing
//             // @level: {int}  tracks the depth of the definition hash

//             Object.keys(input).forEach((iKey) => {
//                if (!iKey) return;

//                var iVal = input[iKey];
//                switch (iKey) {
//                   //
//                   // Constraint Fields:
//                   //
//                   // These specify specific constraints on the overall
//                   // object, but in shorthand we allow it to be coded
//                   // into the field definition.
//                   // for Example:
//                   // {
//                   //    "password" : {
//                   //       "string":true,
//                   //       "with": "confirmPassword"     // <-- constraint
//                   //    },
//                   //    "confirmPassword" : {
//                   //       "string":true
//                   //    }
//                   // }
//                   case "with":
//                   // .with : "other_field"
//                   case "xor":
//                      // .xor: "other_field"
//                      setConstraints.push({
//                         op: iKey,
//                         params: [dKey, iVal],
//                         // paramA: dKey,
//                         // paramB: iVal,
//                      });
//                      break;

//                   case "pattern":
//                      // handler RegEx patterns:
//                      // .pattern: '^[a-zA-Z0-9]{3,30}$'
//                      test = test.pattern(new RegExp(iVal));
//                      break;

//                   case "min":
//                   case "max":
//                      // convert param to integer:
//                      var param = parseInt(iVal);
//                      test = test[iKey](param);
//                      break;

//                   case "type":
//                      console.error(
//                         "reqAB.validateParameters(): .type param is depreciated."
//                      );

//                      // include "string" in email types:
//                      if (input[key] == "email") {
//                         test = test.string();
//                      }
//                      test = test[iVal]();
//                      break;

//                   case "validate":
//                      // this is a custom validator that we should ignore.
//                      break;

//                   default:
//                      // assume the key corresponds to a direct Joi.iKey()
//                      // Example value:
//                      // "email" : {
//                      //    required: true,               // Case 1
//                      //    string: {                     // Case 3
//                      //       min: 5,                    // Case 2
//                      //       email: {                   // Case 4
//                      //          allowUnicode: true,
//                      //          multiple: true
//                      //       }
//                      //    }
//                      // }

//                      // Sanity Check:
//                      // if (typeof test[iKey] != "function") {
//                      //    var error = new Error(
//                      //       "reqAB.validateParemeters(): unknown iJoi param: " +
//                      //          iKey
//                      //    );
//                      //    console.error(error);
//                      //    console.error(test);
//                      //    return;
//                      // }

//                      // Case 1: this is a simple:
//                      //    .iKey: true  ==>  Joi.iKey()  call:
//                      // for example:
//                      //    .required: true
//                      if (typeof iVal == "boolean" && iVal) {
//                         try {
//                            test = test[iKey]();
//                         } catch (e) {
//                            console.error(e);
//                            console.error(`iKey : ${iKey}`);
//                            console.error(`iVal : ${iVal}`);
//                         }

//                         return;
//                      }

//                      // Case 2: this is a simple
//                      // .iKey : value  ==> Joi.iKey( value )  call:
//                      // for example:
//                      //    .min: "5"
//                      //
//                      if (typeof iVal != "object") {
//                         test = test[iKey](iVal);
//                         return;
//                      }

//                      // Case 3: this is our first level description
//                      // with a sub level of following modifiers:
//                      //    .iKey : {                  // Level 1
//                      //       .param1: true,          // Level 2
//                      //       .param2: value
//                      //       .param3: { options }
//                      //    }
//                      // for example:
//                      //    .string: {                 // <-- iKey
//                      //       min: 1,
//                      //       max: 50,
//                      //       email: { options }
//                      //    }

//                      if (level == 1) {
//                         test = test[iKey]();
//                         test = parseRules(test, dKey, iVal, level + 1);
//                         return;
//                      }

//                      // Case 4: this is our 2nd level description where
//                      // we can pass in parameters to a Joi fn():
//                      //    .param : {                 // Level 1
//                      //       .param1: true,          // Level 2
//                      //       .param2: value
//                      //       .iKey: { options }
//                      //    }
//                      // for example:
//                      //    .string: {
//                      //       min: 1,
//                      //       max: 50,
//                      //       email: { options }      // <-- iKey
//                      //    }
//                      test = test[iKey](iVal);
//                      break;
//                }
//             });
//             return test;
//          };

//          // for each variable defined in the description:
//          Object.keys(description).forEach((dKey) => {
//             var input = description[dKey];
//             // all the rules for the current field (dKey)

//             inputs[dKey] = parseRules(Joi, dKey, input);
//             // parse the validation rules
//          });

//          // create our validator object
//          var jObj = Joi.object(inputs);

//          // add in any top level constraints:
//          setConstraints.forEach((con) => {
//             jObj[con.op](...con.params);
//          });

//          // store our new validator:
//          validators[key] = jObj;
//       }

//       var validator = validators[key];
//       var results = null;
//       if (allParams) {
//          results = validator.validate(allParams);
//       } else {
//          results = validator.validate(req.allParams());
//       }

//       // if there are errors due to joi rules:
//       this.__validationErrors = this.__validationErrors || [];
//       this.__validationParamsNormalized =
//          this.__validationParamsNormalized || {};
//       if (results.error) {
//          this.__validationErrors.push(results.error);
//       } else {
//          Object.keys(results.value || {}).forEach((p) => {
//             if (description[p] && description[p].validate) {
//                if (typeof description[p].validate != "function") {
//                   var err = new Error(
//                      `req.ab.validateParameters(): ${p}.validate() is not a function.  Not sure what your attempting here.`
//                   );
//                   console.error(err);
//                   return;
//                }

//                // Run the provided .validation()
//                var r = description[p].validate(
//                   results.value[p],
//                   results.value
//                );

//                // if this resulted in an error, record it
//                if (r.error) {
//                   this.__validationErrors.push(r.error);
//                }

//                // update our normalized results with r.value
//                results.value[p] = r.value;
//             }
//          });
//       }
//    }

//    // record our Normalized Values:
//    if (results && results.value) {
//       this.__validationParamsNormalized = results.value;
//    }

//    if (this.__validationErrors.length > 0 && autoRespond) {
//       var error = this.errorValidation();
//       if (res && res.ab && res.ab.error) {
//          res.ab.error(error);
//       } else {
//          console.error(error);
//       }
//    }

//    return this.__validationErrors.length == 0;
// },
// validationReset: function () {
//    this.__validationErrors = [];
//    this.__validationParamsNormalized = {};
// },
// errorValidation: function () {
//    if (this.__validationErrors.length > 0) {
//       this.log("... validation errors:", this.__validationErrors);
//       // var error = ADCore.error.fromKey('E_MISSINGPARAM');
//       var error = new Error("Validation Errors");
//       error.key = "E_VALIDATION";
//       error.validationErrors = this.__validationErrors;
//       error.code = 422; // RFC 7231 now proposes 400 as better code.
//       return error;
//    }
// },
// serviceRequest: function (key, data, cb) {
//    var timer = process.hrtime();
//    var params = this.toParam(key, data);
//    var domain = key.split(".")[0];
//    if (!domainRequesters[domain]) {
//       this.log(`... creating clientRequester(${domain})`);
//       domainRequesters[domain] = new this.__Requester({
//          name: `ab > requester > ${domain}`,
//          key: domain,
//       });
//    }
//    domainRequesters[domain].send(params, (...params) => {
//       newREQ.__performance[key] = process.hrtime(timer);
//       cb(...params);
//    });
// },

/**
       * socketKey()
       * make sure any socket related key is prefixed by our tenantID
       * @param {string} key
       *       The socket key we are wanting to reference.
       * @return {string}
       * /
      // socketKey: function (key) {
      //    return `${newREQ.tenantID}-${key}`;
      // },

      // expose these for Unit Testing  & mocking:
//       __req: req,
//       __res: res,
//       __console: console,
//       __performance: {},
//       // {hash}  Key : process.hrtime()
//       // used to track multiple timing values.
//       __Requester: cote.Requester,
//       __validationErrors: [],
//    };

//    newREQ.__performance.start = process.hrtime();
//    return newREQ;
// };
*/
