const Sentry = require('@sentry/node');
 
function initSentry(config) {
   const defaults = { 
      sampleRate: 0.1,
      tracesSampleRate: 0.1,
      profilesSampleRate: 0.1
   };
   Sentry.init(Object.assign({}, defaults, config));
}
module.exports = initSentry;
