/**
 * a set of common utilities shared by each of our micro-services
 * @module ab-utils
 * @borrows module:config as config
 * @borrows module:Controller as controller
 * @borrows module:telemetry as telemetry
 * @borrows module:reqApi as reqApi
 * @borrows module:request as reqService
 * @borrows module:resApi as resApi
 */

// Map Environment Variables for redis. Needed to work with the ecs/app module.
// Keep this before any requires of cote
if (
   Object.keys(process.env).every((k) => !k.startsWith("COTE_DISOCOVERY_REDIS"))
) {
   process.env.COTE_DISCOVERY_REDIS_HOST = process.env.SESSION_REDIS_HOST;
   process.env.COTE_DISCOVERY_REDIS_PORT = process.env.SESSION_REDIS_PORT;
   process.env.COTE_DISCOVERY_REDIS_DB = process.env.SESSION_REDIS_DB_INDEX;
}

const config = require("./utils/config.js");
const controller = require("./utils/controller.js");
const defaults = require("./utils/defaults.js");
const telemetry = require("./utils/telemetry.js");
const reqApi = require("./utils/reqApi.js");
const reqService = require("./utils/reqService.js");
const resApi = require("./utils/resApi.js");
const service = require("./utils/service.js");
const { v4: uuid } = require("uuid");

module.exports = {
   config,
   controller,
   defaults,
   reqApi,
   reqService,
   resApi,
   /**
    * @static
    * @kind class
    * @classdesc Our ABService class
    * @see {@link ABService}
    * @extends EventEmitter
    * @param {obj} options
    * @param {string} [options.name=ABService]
    * @example
    * const AB = require("ab.utils");
    * const options = { name: "myService"};
    * const service = new AB.service(options);
    */
   service,
   /**
    * This is an alias for uuid.v4()
    * @name uuid
    * @kind function
    * @static
    * @see [uuid - npm]{@link https://www.npmjs.com/package/uuid}
    * @returns {string} uuid
    */
   telemetry: telemetry(),
   uuid,
};
