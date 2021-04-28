/// serviceRequest.js
///
/*
 * serviceRequest
 *
 * manage a Request to another service.
 */
const cote = require("cote");
const ServiceCote = require("./reqServiceCote.js");

// const { serializeError, deserializeError } = require("serialize-error");

var domainRequesters = {
   /* domainKey : coteRequester */
};

class ABServiceRequest extends ServiceCote {
   /**
    * request()
    * Send a request to another micro-service using the cote protocol.
    * @param {string} key
    *        the service handler's key we are sending a request to.
    * @param {json} data
    *        the data packet to send to the service.
    * @param {fn} cb
    *        a node.js style callback(err, result) for when the response
    *        is received.
    */
   request(key, data, cb) {
      if (this.req.performance) {
         this.req.performance.mark(key);
      }
      var paramStack = this.toParam(key, data);
      var domain = key.split(".")[0];
      if (!domainRequesters[domain]) {
         this.req.log(`... creating clientRequester(${domain})`);
         domainRequesters[domain] = new cote.Requester({
            name: `${this.req.serviceKey} > requester > ${domain}`,
            key: domain,
         });
      }
      domainRequesters[domain].send(paramStack, (err, results) => {
         if (this.req.performance) {
            this.req.performance.measure(key, key);
         }
         if (err) {
            err._serviceRequest = key;
            err._params = paramStack;
         }
         cb(err, results);
      });
   }
}

module.exports = function (...params) {
   return new ABServiceRequest(...params);
};
