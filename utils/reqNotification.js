// reqNotification.js
const { serializeError /*, deserializeError */ } = require("serialize-error");

const UserFields = ["uuid", "username", "email", "languageCode"];
// {array}
// a subset of User fields that we want to include in our notification data.

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
      info.user = {};
      UserFields.forEach((k) => {
         info.user[k] = this.req?._user?.[k] ?? "??";
      });

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
