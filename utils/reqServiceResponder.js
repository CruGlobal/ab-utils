// reqServiceResponder.js
/*
 * ServiceResponder
 *
 * manage the responses to a ServiceRequest.
 */
const cote = require("cote");

const { serializeError /*, deserializeError */ } = require("serialize-error");

var domainResponder = {
   /* domainKey : coteResponder */
};

class ABServiceResponder {
   constructor(key, handler, req) {
      this.key = key;
      this.handler = handler;
      this.req = req;

      var domainKey = key.split(".")[0];
      if (!domainResponder[domainKey]) {
         domainResponder[domainKey] = new cote.Responder({
            name: domainKey,
            key: domainKey,
         });
      }

      domainResponder[domainKey].on(key, (data, cb) => {
         var packet = data.param;

         var abReq = null;
         if (this.req.controller) {
            // make an instance of reqService
            abReq = new this.req.constructor(packet, this.req.controller);
         } else {
            // make an instance of reqApi
            abReq = new this.req.constructor(null, null);
            abReq.jobID = packet.jobID;
            abReq.tenantID = packet.tenantID;
            abReq._user = packet.user;

            abReq._data = packet.data || packet.param;

            abReq.param = (key) => {
               if (key) {
                  return abReq._data[key];
               }
               return abReq._data;
            };
         }

         abReq.log(`ServiceResponder::${key}`);
         abReq.performance.mark(key);
         this.handler(abReq, (err, response) => {
            // TODO: any additional error procesing here?
            if (err) {
               err = serializeError(err);
            }

            abReq.performance.measure(key);
            abReq.performance.log(key);
            cb(err, response);
         });
      });
   }
}

module.exports = function (...params) {
   return new ABServiceResponder(...params);
};
