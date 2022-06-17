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

const REQUEST_TIMEOUT = 5000;
const ATTEMPT_REQUEST_MAXIMUM = 5;

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
      let countRequest = 0;
      // var countTimeout = 1;
      // var timeOutID = setInterval(() => {
      //    this.req.log(
      //       `... timeout ${countTimeout++} waiting for request(${key})`
      //    );
      // }, 1000);

      var paramStack = this.toParam(key, data);
      var domain = key.split(".")[0];
      if (!domainRequesters[domain]) {
         this.req.log(`... creating clientRequester(${domain})`);
         domainRequesters[domain] = new cote.Requester({
            name: `${this.req.serviceKey} > requester > ${domain}`,
            key: domain,
            // https://github.com/dashersw/cote/blob/master/src/components/requester.js#L16
            timeout: REQUEST_TIMEOUT,
         });
      }

      const sendRequest = () => {
         countRequest += 1;

         domainRequesters[domain].send(paramStack, (err, results) => {
            if (this.req.performance) {
               this.req.performance.measure(key, key);
            }
            // clearInterval(timeOutID);
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
}

module.exports = function (...params) {
   return new ABServiceRequest(...params);
};
