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
    * Send a request to another micro-service using the cote protocol. Accept an
    * optional callback, but also returns a promise.
    * @param {string} key the service handler's key we are sending a request to.
    * @param {json} data the data packet to send to the service.
    * @param {object} [options] optional options
    * @param {number} [options.timeout=5000] ms to wait before timing out
    * @param {number}[options.maxAttempts=5] how many times to try the request if
    *  it fails
    * @param {boolean} [options.longRequest=false] timeout after 90 seconds,
    * will be ignored if timeout was set
    * @param {function} [cb] optional node.js style callback(err, result) for
    * when the response is received.
    * @returns {Promise} resolves with the response from the service
    * @example
    * // async/await
    * try {
    *    let result = await request(key, data);
    * } catch (err) {}
    * // promise
    * request(key, data, opts).then((result) => {}).catch((err) => {})
    * // callback
    * request(key, data, opts, (err, result) => {})
    * // or
    * request(key, data, (err, result) => {})
    */
   request(key, data, ...args) {
      if (this.req.performance) this.req.performance.mark(key);
      // handle args
      const callback = args.find((arg) => typeof arg == "function");
      const options = args.find((arg) => typeof arg == "object") ?? {};
      if (data.longRequest) {
         this.req.notify.developer(
            "Depreciated data.longRequest passed to req.serviceRequest()",
            {
               details:
                  "Warning: serviceRequest() now supports an options parameter `serviceRequest(key, data, options = {}, callback?)`. Please refactor longRequest to options",
            }
         );
         options.longRequest = data.longRequest;
         delete data.longRequest;
      }
      var timeout =
         options.timeout ??
         (options.longRequest ? LONG_REQUEST_TIMEOUT : REQUEST_TIMEOUT);
      var attempts = options.maxAttempts ?? ATTEMPT_REQUEST_MAXIMUM;

      let countRequest = 0;

      const paramStack = this.toParam(key, data);
      const domain = key.split(".")[0];
      const requester = this.getRequester(domain);

      var timeoutCleanup = false;
      // {bool}
      // are we attempting to clean up a timedout service call?

      let returnPromise = new Promise((resolve, reject) => {
         const sendRequest = () => {
            countRequest += 1;

            requester.send(
               {
                  ...paramStack,
                  __timeout: timeout,
               },
               (err, results) => {
                  let finalTime;
                  if (this.req.performance) {
                     finalTime = this.req.performance.measure(key, key);
                  }

                  if (err) {
                     // https://github.com/dashersw/cote/blob/master/src/components/requester.js#L132
                     if (err.message === "Request timed out.") {
                        // Retry .send
                        if (!timeoutCleanup && countRequest < attempts) {
                           this.req.log(
                              `... timeout waiting for request (${key}), retrying ${countRequest}/${ATTEMPT_REQUEST_MAXIMUM}`
                           );

                           sendRequest();
                           return;
                        }

                        if (timeoutCleanup && countRequest < attempts) {
                           // Q: should we attempt to scale our timeouts?
                           timeout *= 1.5;

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
                        paramStack: JSON.stringify(paramStack, null, 3),
                        finalTime,
                        err,
                        results, // <--- Do we send this?  might be too large
                     });
                     return;
                  }

                  // now complete the Promise (or reject if timeout or err)
                  callback?.(err, results);
                  if (err) {
                     reject(err);
                  } else {
                     resolve(results);
                  }

                  // NOTE: now we make one last request to wait until the service
                  // actually responds ... if it does.
                  // if so, we calculate how long it finally took for the service to
                  // respond, and log that deliquent service.

                  // if err && err.message == "Request timed out."  && ! timeoutCleanup
                  if (!timeoutCleanup && err?.message == "Request timed out.") {
                     // now since we are just waiting around:
                     timeout = LONG_REQUEST_TIMEOUT;
                     attempts = ATTEMPT_REQUEST_OVERTIME;
                     timeoutCleanup = true;
                     countRequest = 0;
                     sendRequest();
                  }
               }
            );
         };
         sendRequest();
      });

      // NOTE: this is to prevent ERR_UNHANDLED_REJECTION errors when using the
      // callback form of the API.
      returnPromise.catch(() => {});

      // NOTE: we are returning the original promise, so the user can still
      // provide their own .catch() and get the error as well:
      return returnPromise;
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
