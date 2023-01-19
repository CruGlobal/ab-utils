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
const ATTEMPT_REQUEST_OVERTIME = ATTEMPT_REQUEST_MAXIMUM * 10;

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

      var timeoutCleanup = false;
      // {bool}
      // are we attempting to clean up a timedout service call?

      const sendRequest = () => {
         countRequest += 1;

         requester.send(paramStack, (err, results) => {
            let finalTime;
            if (this.req.performance) {
               finalTime = this.req.performance.measure(key, key);
            }

            if (err) {
               // https://github.com/dashersw/cote/blob/master/src/components/requester.js#L132
               if (err.message === "Request timed out.") {
                  // Retry .send
                  if (
                     !timeoutCleanup &&
                     countRequest < ATTEMPT_REQUEST_MAXIMUM
                  ) {
                     this.req.log(
                        `... timeout waiting for request (${key}), retrying ${countRequest}/${ATTEMPT_REQUEST_MAXIMUM}`
                     );

                     sendRequest();
                     return;
                  }

                  if (
                     timeoutCleanup &&
                     countRequest < ATTEMPT_REQUEST_OVERTIME
                  ) {
                     // Q: should we attempt to scale our timeouts?
                     if (!paramStack.__timeout) {
                        paramStack.__timeout = REQUEST_TIMEOUT;
                     }
                     // increase the timeout
                     paramStack.__timeout *= 1.5;

                     this.req.log(
                        `... OVERTIME: waiting for eventual response (${key}), retrying ${countRequest}/${ATTEMPT_REQUEST_OVERTIME}`
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

            if (timeoutCleanup) {
               this.req.notify.developer(err, {
                  message: `EOVERTIME: Handler response after timout`,
                  paramStack,
                  finalTime,
                  err,
                  results, // <--- Do we send this?  might be too large
               });
               return;
            }

            cb(err, results);

            // NOTE: now we make one last request to wait until the service
            // actually responds ... if it does.
            // if so, we calculate how long it finally took for the service to
            // respond, and log that deliquent service.

            // if err && err.message == "Request timed out."  && ! timeoutCleanup
            if (!timeoutCleanup && err?.message == "Request timed out.") {
               // now since we are just waiting around:
               paramStack.__timeout = LONG_REQUEST_TIMEOUT;
               timeoutCleanup = true;
               countRequest = 0;
               sendRequest();
            }
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
            key: domain,
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
