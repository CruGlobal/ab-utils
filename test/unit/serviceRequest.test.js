const assert = require("assert");
const proxyquire = require("proxyquire");
const sinon = require("sinon");

const RequesterFake = sinon.fake();
const ABServiceRequest = proxyquire("../../utils/serviceRequest.js", {
   cote: { Requester: RequesterFake },
});
const serviceRequest = ABServiceRequest();
const notify = sinon.fake();
serviceRequest.req = {
   log: sinon.stub(),
   serviceKey: "test_service",
   notify: { developer: notify },
};

const sendStub = sinon.stub();
/** @const {stub} sendStub - Will be requster.send() for .request() tests */

describe("ServiceRequest tests", () => {
   it(".getRequester() creates a cote Requester", () => {
      serviceRequest.getRequester("test_domain");
      // Call twice to test multiple calls use the same requester
      serviceRequest.getRequester("test_domain");
      assert.equal(RequesterFake.callCount, 1);
      assert(RequesterFake.calledWithNew);
      assert.deepEqual(RequesterFake.firstCall.firstArg, {
         name: "test_service > requester > test_domain",
         key: "test_domain",
         timeout: 5000,
      });
   });

   describe(".request()", () => {
      before(() => {
         sinon.stub(serviceRequest, "getRequester").returns({
            send: sendStub,
         });
      });
      beforeEach(() => {
         sendStub.reset();
         notify.resetHistory();
      });
      it("calls the callback", async () => {
         sendStub.resolves({ success: true });
         const data = { test: true };
         const callback = sinon.fake();
         await serviceRequest.request("service.test", data, callback);
         // callback works in both positions
         await serviceRequest.request("service.test", data, {}, callback);

         assert.equal(callback.callCount, 2);
         assert.deepEqual(callback.firstCall.args, [null, { success: true }]);
         assert.equal(sendStub.callCount, 2);
         assert.deepEqual(sendStub.firstCall.firstArg, {
            __timeout: 5000,
            param: {
               data,
               jobID: undefined,
               requestID: undefined,
               tenantID: undefined,
               user: undefined,
               userReal: undefined,
            },
            type: "service.test",
         });
      });

      it("calls callback with error", async () => {
         const err = new Error("Test Error");
         sendStub.rejects(err);
         const callback = sinon.fake();
         await serviceRequest.request("service.test", {}, callback);
         assert(notify.calledOnce);
         assert.equal(callback.callCount, 1);
         assert.deepEqual(callback.firstCall.args, [err]);
      });

      it("returns a promise", async () => {
         sendStub.resolves({ success: true });
         const data = { test: true };
         const promise = serviceRequest.request("service.test", data);
         assert(promise instanceof Promise);
         const response = await promise;
         assert.deepEqual(response, { success: true });
         assert.equal(sendStub.callCount, 1);
         assert.deepEqual(sendStub.firstCall.firstArg, {
            __timeout: 5000,
            param: {
               data,
               jobID: undefined,
               requestID: undefined,
               tenantID: undefined,
               user: undefined,
               userReal: undefined,
            },
            type: "service.test",
         });
      });

      it("rejects a promise", async () => {
         const err = new Error("Test Error");
         sendStub.rejects(err);
         serviceRequest.request("service.test", {}).catch((caught) => {
            assert.deepEqual(caught, err);
         });
      });

      it("retries a timeout", async () => {
         sendStub.rejects(new Error("Request timed out."));
         try {
            await serviceRequest.request("service.test", {});
         } catch (err) {
            // We expect this
         }
         assert.equal(sendStub.callCount, 5);
      });

      it("called with options.maxAttempts", async () => {
         sendStub.rejects(new Error("Request timed out."));
         try {
            await serviceRequest.request(
               "service.test",
               {},
               { maxAttempts: 1 }
            );
         } catch (err) {
            // We expect this
         }
         assert.equal(sendStub.callCount, 1);
      });

      it("called with options.timeout", async () => {
         sendStub.resolves();
         await serviceRequest.request("service.test", {}, { timeout: 15000 });
         await serviceRequest.request(
            "service.test",
            {},
            { timeout: 15000, longRequest: true } // longRequest should be ignored here
         );

         const expectedArg = {
            __timeout: 15000,
            param: {
               data: {},
               jobID: undefined,
               requestID: undefined,
               tenantID: undefined,
               user: undefined,
               userReal: undefined,
            },
            type: "service.test",
         };

         assert.deepEqual(sendStub.firstCall.firstArg, expectedArg);
         assert.deepEqual(sendStub.secondCall.firstArg, expectedArg);
      });

      it("called with options.longRequest", async () => {
         sendStub.resolves();
         await serviceRequest.request(
            "service.test",
            {},
            { longRequest: true }
         );

         assert.deepEqual(sendStub.firstCall.firstArg, {
            __timeout: 90000,
            param: {
               data: {},
               jobID: undefined,
               requestID: undefined,
               tenantID: undefined,
               user: undefined,
               userReal: undefined,
            },
            type: "service.test",
         });
      });

      // Legacy case, needs to work
      it("called with data.longRequest", async () => {
         sendStub.resolves();
         await serviceRequest.request("service.test", {
            value: 1,
            longRequest: true,
         });

         assert.deepEqual(sendStub.firstCall.firstArg, {
            __timeout: 90000,
            param: {
               data: { value: 1 },
               jobID: undefined,
               requestID: undefined,
               tenantID: undefined,
               user: undefined,
               userReal: undefined,
            },
            type: "service.test",
         });
      });

      it("failed log_manager.notification doesn't call notify", async () => {
         sendStub.rejects();
         try {
            await serviceRequest.request("log_manager.notification", {
               value: 1,
            });
         } catch (e) {
            //expected
         }
         assert(notify.notCalled);
      });
   });
});
