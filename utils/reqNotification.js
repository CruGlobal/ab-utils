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
      if (this.req._user) {
         UserFields.forEach((k) => {
            if (typeof this.req._user[k] == "undefined") {
               info.user[k] = "??";
               return;
            }
            info.user[k] = this.req._user[k];
         });
      }

      if (info.AB) {
         var AB = info.AB;
         delete info.AB;
         info = AB._notifyInfo(info);
      }

      // We need to remove circular data from info, because it get's stringified later
      try {
         JSON.stringify(info);
      } catch (err) {
         // Source: https://stackoverflow.com/questions/11616630/how-can-i-print-a-circular-structure-in-a-json-like-format
         const cache = [];
         const infoStr = JSON.stringify(info, (key, value) => {
            if (typeof value === "object" && value !== null) {
               // Duplicate reference found, discard key
               if (cache.includes(value)) return;
               // Store value in our collection
               cache.push(value);
            }
            if (typeof value === "bigint") value = value.toString();
            return value;
         });
         info = JSON.parse(infoStr);
      }

      var jobData = {
         domain,
         error: serError,
         info,
         callStack: errStack.stack,
      };

      this.req.serviceRequest("log_manager.notification", jobData, (err) => {
         this.req.log(err);
      });
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
