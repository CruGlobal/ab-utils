// reqNotification.js
const { serializeError /*, deserializeError */ } = require("serialize-error");

class ABNotification {
   constructor(req) {
      this.req = req;
   }

   notify(domain, error, info = {}) {
      var serError = this.stringifyErrors(error);

      var errStack = new Error("just getting my stack");

      info.tenantID = info.tenantID || this.req ? this.req._tenantID : "??";
      info.jobID = info.jobID || this.req ? this.req.jobID : "??";
      info.serviceKey = this.req ? this.req.serviceKey : "??";
      info.user = this.req ? this.req._user : "??";

      if (info.AB) {
         var AB = info.AB;
         delete info.AB;
         info = AB._notifyInfo(info);
      }

      // TODO: perhaps this should trigger a 'system.notification' process?
      var jobData = {
         domain,
         error: serError,
         info,
         callStack: errStack.stack,
      };
      this.req.log(
         "TODO: reqNotification.notify() : trigger 'system.notification' ",
         jobData
      );
   }

   stringifyErrors(param) {
      if (param instanceof Error) {
         return serializeError(param);
      }

      // traverse given data structure:
      if (Array.isArray(param)) {
         for (var i = 0; i < param.length; i++) {
            param[i] = this.stringifyErrors(param[i]);
         }
      } else if (param && typeof param === "object") {
         // maybe one of my Keys are an Error Object:
         Object.keys(param).forEach((k) => {
            param[k] = this.stringifyErrors(param[k]);
         });
      }

      return param;
   }
}

module.exports = function (...params) {
   return new ABNotification(...params);
};
