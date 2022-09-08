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

const REQUEST_TIMEOUT = 5000; // 5 Seconds
const LONG_REQUEST_TIMEOUT = 90000; // 90 Seconds
const ATTEMPT_REQUEST_MAXIMUM = 5;

const domainRequesters = {
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
      let countRequest = 0;
      const longRequest = data.longRequest ?? false;
      delete data.longRequest; // The service does not need this passed.

      const paramStack = this.toParam(key, data);
      const domain = key.split(".")[0];
      const requester = this.getRequester(domain, longRequest);

      const sendRequest = () => {
         countRequest += 1;

         requester.send(paramStack, (err, results) => {
            if (this.req.performance) {
               this.req.performance.measure(key, key);
            }

            if (err) {
               // https://github.com/dashersw/cote/blob/master/src/components/requester.js#L132
               if (err.message === "Request timed out.") {
                  // Retry .send
                  if (countRequest < ATTEMPT_REQUEST_MAXIMUM) {
                     this.req.log(
                        `... timeout waiting for request (${key}), retrying ${countRequest}/${ATTEMPT_REQUEST_MAXIMUM}`
                     );
                     sendRequest();
                     return;
                  }

                  this.req.notify.developer(err, {
                     message: `Could not request (${key}) - ${JSON.stringify(
                        paramStack
                     )}`,
                  });
               }

               err._serviceRequest = key;
               err._params = paramStack;
            }
            cb(err, results);
         });
      };
      sendRequest();
   }

   /**
    * Gets a cached requester for the domain, creating one if needed
    * @function getRequester
    * @param {string} domain cote domain key
    * @param {boolean} long whether the requester needs a longer timeout
    */
   getRequester(domain, long) {
      const key = `${domain}${long ? "_long" : ""}`;
      if (!domainRequesters[key]) {
         this.req.log(`... creating clientRequester(${key})`);
         domainRequesters[key] = new cote.Requester({
            name: `${this.req.serviceKey} > requester > ${key}`,
            key,
            // https://github.com/dashersw/cote/blob/master/src/components/requester.js#L16
            timeout: long ? LONG_REQUEST_TIMEOUT : REQUEST_TIMEOUT,
         });
      }
      return domainRequesters[key];
   }
}

module.exports = function (...params) {
   return new ABServiceRequest(...params);
};
