const { assert } = require("chai");
const proxyquire = require("proxyquire").noCallThru();
const sinon = require("sinon");

const stubNotify = sinon.stub();
const reqNotification = proxyquire("../../utils/reqNotification.js",
{
   "./telemetry": () => {
      return {
         notify: stubNotify,
      }
   }
});

const req = {
   serviceRequest: sinon.fake(),
   _tenantID: "tenant",
   jobID: "job",
   requestID: "request",
   serviceKey: "key",
   log: () => {},
};

describe("ABNotification", () => {
   beforeEach(() => {});

   afterEach(() => {
      sinon.restore();
   });

   describe("notify()", () => {
      it("notify calls telemetry.notify()", async () => {
         const notification = reqNotification(req);
         const fakeStringifyErrors = sinon.replace(
            notification,
            "stringifyErrors",
            sinon.fake.returns("stringified error")
         )
         const error = new Error("test error");
         await notification.notify("developer", error, {});
         assert.equal(fakeStringifyErrors.callCount, 1, "stringifyErrors not called?");
         assert(stubNotify.calledOnce);
         const jobData = stubNotify.firstCall.firstArg;
         assert.deepOwnInclude(jobData, {
            domain: "developer",
            error: "stringified error",
            info: {
               jobID: "job",
               requestID: "request",
               serviceKey: "key",
               tenantID: "tenant",
               user: {},
            }
         }),
         assert.equal(stubNotify.firstCall.args[1], error);
      });
   });
});

