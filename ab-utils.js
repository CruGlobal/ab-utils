// ab-utils
// a set of common utilities shared by each of our microsservices
//
const config = require("./utils/config.js");
const controller = require("./utils/controller.js");
const reqApi = require("./utils/reqApi.js");
const reqService = require("./utils/reqService.js");
const resApi = require("./utils/resApi.js");
const service = require("./utils/service.js");
// const { uuid } = require("uuidv4");
const { v4: uuid } = require("uuid");

module.exports = {
   config,
   controller,
   reqApi,
   reqService,
   resApi,
   service,
   uuid,
};
