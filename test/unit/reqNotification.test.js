const { assert } = require("chai");
const proxyquire = require("proxyquire").noCallThru();
const sinon = require("sinon");

const stubCaptureException = sinon.stub()
const reqNotification = proxyquire("../../utils/reqNotification.js",

{
   "@sentry/node": {
      captureException: stubCaptureException,
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

const notification = reqNotification(req);

sinon.replace(
   notification,
   "stringifyErrors",
   sinon.fake.returns("stringified error")
)

/**
 * Helper: generate a stubbed sentry scope
 * @returns {object}
 */
function stubbedScope() {
   return {
      setContext: sinon.stub(),
      setLevel: sinon.stub(),
      setTag: sinon.stub(),
      setUser: sinon.stub(),
   }
}

describe("ABNotification", () => {
   beforeEach(() => {});

   afterEach(() => {
      sinon.restore();
      stubCaptureException.resetHistory();
   });

   describe("notify()", () => {
      it("notify as developer sends to Sentry with scope", async () => {
         await notification.notify("developer", "error message", {});
         assert.equal(stubCaptureException.callCount, 1);
         const scopeFn = stubCaptureException.firstCall.args[1];

         // test the scope function passed to sentry
         const scope = stubbedScope();
         scopeFn(scope);
         
         assert(scope.setLevel.notCalled);
         assert(scope.setUser.calledOnceWith({}));
         assert.equal(scope.setTag.callCount, 2);
         assert.deepEqual(scope.setTag.firstCall.args, ["domain", "developer"]);
         assert.deepEqual(scope.setTag.secondCall.args, ["tenant", "tenant"]);
         assert(scope.setContext.calledOnce)
         assert.equal(scope.setContext.firstCall.firstArg, "info");
         assert.deepEqual(scope.setContext.firstCall.args[1], 
            {
               jobID: "job",
               requestID: "request",
               serviceKey: "key",
               tenantID: "tenant",
               user: {},
            }
         );
      });
      it("notify as builder sends to Sentry with scope", async () => {
         await notification.notify("builder", "error message", {});
         assert.equal(stubCaptureException.callCount, 1);
         const scopeFn = stubCaptureException.firstCall.args[1];

         // test the scope function passed to sentry
         const scope = stubbedScope();
         scopeFn(scope);
         
         assert(scope.setLevel.calledOnceWith("warning"));
         assert(scope.setUser.calledOnceWith({}));
         assert.equal(scope.setTag.callCount, 2);
         assert.deepEqual(scope.setTag.firstCall.args, ["domain", "builder"]);
         assert.deepEqual(scope.setTag.secondCall.args, ["tenant", "tenant"]);
         assert(scope.setContext.calledOnce)
         assert.equal(scope.setContext.firstCall.firstArg, "info");
         assert.deepEqual(scope.setContext.firstCall.args[1], 
            {
               jobID: "job",
               requestID: "request",
               serviceKey: "key",
               tenantID: "tenant",
               user: {},
            }
         );
      });
      it("notify with a string sends an Error to sentry", async () => {
         await notification.notify("builder", "error message", {});
         assert(stubCaptureException.firstCall.firstArg instanceof Error);
         assert.deepEqual(stubCaptureException.firstCall.firstArg, new Error("error message"));
      });
      it("notify with an Error sends that Error to sentry", async () => {
         const testError = new Error("Test Error");
         await notification.notify("builder", testError, {});
         assert(stubCaptureException.firstCall.firstArg instanceof Error);
         // Should be the same instance (not deepEqual)
         assert.equal(stubCaptureException.firstCall.firstArg, testError);
      });
      it("notify with an array sends the .stringifyErrors() result to sentry", async () => {
         const fakeStringify = sinon.replace(
            notification,
            "stringifyErrors",
            sinon.fake.returns("stringified error")
         )         
         await notification.notify("builder", [ new Error() ], {});
         assert.equal(typeof stubCaptureException.firstCall.firstArg, "string");
         assert.equal(stubCaptureException.firstCall.firstArg,"stringified error");
         assert(fakeStringify.calledOnce);
      });
   });
});
