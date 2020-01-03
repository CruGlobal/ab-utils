/*
 * reqAB
 * prepare a default set of data/utilities for our api request.
 */
const shortid = require("shortid");
module.exports = function(req, res) {
   return {
      jobID: shortid.generate(),
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

         return this.__validationErrors.length == 0;
      },
      errorValidation: function() {},
      __req: req,
      __res: res,
      __validationErrors: []
   };
};
