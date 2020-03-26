/*
 * reqAB
 * prepare a default set of data/utilities for our api request.
 */
const shortid = require("shortid");
const cote = require("cote");
var Joi = null;
const NODE_MAJOR_VERSION = process.versions.node.split(".")[0];
if (NODE_MAJOR_VERSION >= 12) {
   Joi = require("@hapi/joi");
}

var domainRequesters = {
   /* domainKey : coteRequester */
};

var validators = {
   /* description : Joi.object() */
};

module.exports = function(req, res) {
   return {
      jobID: shortid.generate(),
      tenantID: "??",
      user: null,
      tenantSet: function() {
         return this.tenantID != "??";
      },
      log: function(...allArgs) {
         var args = [];
         allArgs.forEach((a) => {
            args.push(JSON.stringify(a));
         });
         this.__console.log(`${this.jobID}::${args.join(" ")}`);
      },
      toParam: function(key, data) {
         data = data || {};
         return {
            type: key,
            param: {
               jobID: this.jobID,
               tenantID: this.tenantID,
               user: this.user,
               data
            }
         };
      },
      validateParameters: function(description, autoRespond, allParams) {
         description = description || {};
         if (typeof autoRespond == "undefined") {
            autoRespond = true;
         }

         /*
          * description = {
          *   "field" : { type: "type", required: [true|false] }
          * }
          */
         if (Joi) {
            var key = JSON.stringify(description);
            if (!validators[key]) {
               // parse the description to create a Joi.object() validator:
               var inputs = {};
               // final { "field": Joi.rules() } object:

               // for each variable defined in the description:
               Object.keys(description).forEach((dKey) => {
                  var test = Joi;
                  var input = description[dKey];
                  // all the rules for the current field (dKey)
                  var setConstraints = [];
                  // some rules are applied to the final Joi.object()

                  Object.keys(input).forEach((iKey) => {
                     var iVal = input[iKey];
                     switch (iKey) {
                        case "with":
                        // .with : "other_field"
                        case "xor":
                           // .xor: "other_field"
                           setConstraints.push({
                              op: iKey,
                              paramA: dKey,
                              paramB: iVal
                           });
                           break;

                        case "pattern":
                           // handler RegEx patterns:
                           // .pattern: '^[a-zA-Z0-9]{3,30}$'
                           test = test.pattern(new RegExp(iVal));
                           break;

                        case "min":
                        case "max":
                           // convert param to integer:
                           var param = parseInt(iVal);
                           test = test[iKey](param);
                           break;

                        case "type":
                           // include "string" in email types:
                           if (input[key] == "email") {
                              test = test.string();
                           }
                           test = test[iVal]();
                           break;

                        default:
                           // assume the key corresponds to a direct Joi.iKey()
                           // .required: true | false
                           // .email: { additional joi .email params }
                           // .email: true

                           if (iVal) {
                              if (iKey == "email" && typeof iVal == "object") {
                                 test = test[iKey](iVal);
                              } else {
                                 test = test[iKey]();
                              }
                           }

                           break;
                     }
                  });

                  inputs[dKey] = test;
               });

               // create our validator object
               var jObj = Joi.object(inputs);

               // add in any top level constraints:
               setConstraints.forEach((con) => {
                  jObj[con.op](con.paramA, con.paramB);
               });

               // store our new validator:
               validators[key] = jObj;
            }

            var validator = validators[key];
            var results = null;
            if (allParams) {
               results = validator.validate(allParams);
            } else {
               results = validator.validate(req.allParams());
            }

            if (results.error) {
               this.__validationErrors.push(results.error);
            }
         }

         if (this.__validationErrors.length > 0 && autoRespond) {
            var error = this.errorValidation();
            if (res && res.ab && res.ab.error) {
               res.ab.error(error);
            } else {
               console.error(error);
            }
         }

         return this.__validationErrors.length == 0;
      },
      validationReset: function() {
         this.__validationErrors = [];
      },
      errorValidation: function() {
         if (this.__validationErrors.length > 0) {
            this.log("... validation errors:", this.__validationErrors);
            // var error = ADCore.error.fromKey('E_MISSINGPARAM');
            var error = new Error("Validation Errors");
            error.key = "E_VALIDATION";
            error.validationErrors = this.__validationErrors;
            error.code = 422; // RFC 7231 now proposes 400 as better code.
            return error;
         }
      },
      serviceRequest: function(key, data, cb) {
         var params = this.toParam(key, data);
         var domain = key.split(".")[0];
         if (!domainRequesters[domain]) {
            this.log(`... creating clientRequester(${domain})`);
            domainRequesters[domain] = new this.__Requester({
               name: `ab > requester > ${domain}`,
               key: domain
            });
         }
         domainRequesters[domain].send(params, cb);
      },
      // expose these for Unit Testing  & mocking:
      __req: req,
      __res: res,
      __console: console,
      __Requester: cote.Requester,
      __validationErrors: []
   };
};
