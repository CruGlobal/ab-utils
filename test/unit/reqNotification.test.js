const { assert } = require("chai");
const sinon = require("sinon");
const reqNotification = require("../../utils/reqNotification.js");

const req = {
   serviceRequest: sinon.fake(),
   _tenantID: "tenant",
   jobID: "job",
   serviceKey: "key",
};
const notification = reqNotification(req);
describe("ABNotification", () => {
   beforeEach(() => {});

   afterEach(() => {
      sinon.restore();
   });

   describe("notify()", () => {
      it("sends a request log_manager.notification ", function () {
         const stringifyErrors = sinon.replace(
            notification,
            "stringifyErrors",
            sinon.fake.returns("stringified error")
         );
         notification.notify("developer", "error message", {});
         assert(req.serviceRequest.calledOnce);
         assert.equal(
            req.serviceRequest.firstCall.firstArg,
            "log_manager.notification"
         );
         const jobData = req.serviceRequest.firstCall.args[1];
         assert.deepOwnInclude(jobData, {
            domain: "developer",
            error: "stringified error",
            info: {
               jobID: "job",
               serviceKey: "key",
               tenantID: "tenant",
               user: {},
            },
         });
         assert.containsAllKeys(jobData, ["callStack"]);
         assert(stringifyErrors.calledOnceWith("error message"));
      });
   });
});
