/*
 * reqAB
 * prepare a default set of data/utilities for our api request.
 */
const shortid = require("shortid");
module.exports = function(req, res) {
   return {
      jobID: shortid.generate(),
      tenantID: "??",
      tenantSet: () => {
         return this.tenantID != "??";
      },
      log: function(...allArgs) {
         var args = [];
         allArgs.forEach((a) => {
            args.push(JSON.stringify(a));
         });
         console.log(`${this.jobID}::${args.join(" ")}`);
      },
      toParam: function(key, data) {
         data = data || {};
         return {
            type: key,
            param: {
               jobID: this.jobID,
               tenantID: this.tenantID,
               data
            }
         };
      },
      validateParameters: function(description, autoRespond) {
         description = description || {};
         if (typeof autoRespond == "undefined") {
            autoRespond = true;
         }

         /*
          * description = {
          *   "field" : { type: "type", required: [true|false] }
          * }
          */

         if (this.__validationErrors.length > 0 && autoRespond) {
            var error = this.errorValidation();
            res.ab.error(error);
         }

         return this.__validationErrors.length == 0;
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
      __req: req,
      __res: res,
      __validationErrors: []
   };
};
