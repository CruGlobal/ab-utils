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

/** @extends ABServiceCote */
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
   async request(key, data, ...args) {
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
      const timeout =
         options.timeout ??
         (options.longRequest ? LONG_REQUEST_TIMEOUT : REQUEST_TIMEOUT);
      const attempts = options.maxAttempts ?? ATTEMPT_REQUEST_MAXIMUM;

      let requestCount = 0;

      const paramStack = this.toParam(key, data);
      const domain = key.split(".")[0];
      const requester = this.getRequester(domain);
      const sendRequest = async () => {
         requestCount += 1;
         try {
            const results = await requester.send({
               ...paramStack,
               __timeout: timeout,
            });
            return results;
         } catch (err) {
            if (
               err.message === "Request timed out." &&
               requestCount < attempts
            ) {
               this.req.log(
                  `... timeout waiting for request (${key}), retrying ${requestCount}/${attempts}`
               );
               return await sendRequest();
            } else {
               throw err;
            }
         }
      };
      try {
         const results = await sendRequest();
         if (this.req.performance) {
            this.req.performance.measure(key, key);
         }
         if (callback) return callback(null, results);
         return results;
      } catch (err) {
         err._serviceRequest = key;
         err._params = paramStack;
         this.req.notify.developer(err, {
            message: `Could not request (${key}) - ${JSON.stringify(
               paramStack
            )}`,
         });
         if (callback) return callback(err);
         throw err;
      }
   }

   /**
    * Gets a cached requester for the domain, creating one if needed
    * @param {string} domain cote domain key
    * @param {boolean} long whether the requester needs a longer timeout
    */
   getRequester(domain) {
      if (!domainRequesters[domain]) {
         this.req.log(`... creating clientRequester(${domain})`);
         domainRequesters[domain] = new cote.Requester({
            name: `${this.req.serviceKey} > requester > ${domain}`,
            key: domain,
            // https://github.com/dashersw/cote/blob/master/src/components/requester.js#L16
            timeout: REQUEST_TIMEOUT,
         });
      }
      return domainRequesters[domain];
   }
}

module.exports = function (...params) {
   return new ABServiceRequest(...params);
};
