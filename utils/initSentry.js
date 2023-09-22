/**
 * @module initSentry
 * @ignore
 */
const Sentry = require('@sentry/node');

/**
 * Initializes sentry. This should be called by the service on start up if
 * we want to track it in Sentry.
 * @param {Sentry.NodeOptions} options options for Sentry. Expects a DSN.
 */
module.exports = (config) => {
   const defaults = { 
      sampleRate: 0.1,
      tracesSampleRate: 0.1,
      profilesSampleRate: 0.1
   };
   Sentry.init(Object.assign({}, defaults, config));
}
