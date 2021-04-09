/// serviceRequest.js
///
/*
 * request
 *
 * return a modified req object that supports our typical AB functions.
 * @param {obj} req the standard request object received from the Cote service.
 * @return {ABRequest}
 */
const cote = require("cote");

const { serializeError, deserializeError } = require("serialize-error");

var domainRequesters = {
   /* domainKey : coteRequester */
};

class ABServiceRequest {
   constructor(req) {
      this.req = req;
   }

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

   /**
    * toParam()
    * repackage the current data into a common format between our services
    * @param {string} key
    *			The cote request key that identifies which service we are sending
    *			our request to.
    * @param {json} data
    *			The data packet we are providing to the service.
    */
   toParam(key, data) {
      data = data || {};
      return {
         type: key,
         param: {
            jobID: this.req.jobID,
            tenantID: this.req._tenantID,
            user: this.req._user,
            data,
         },
      };
   }
}

module.exports = function (...params) {
   return new ABServiceRequest(...params);
};
