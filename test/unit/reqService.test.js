const { assert } = require("chai");
const sinon = require("sinon");
const proxyquire = require("proxyquire").noCallThru();

const fakeStartSpan = sinon.fake.returns("fake span");
const fakeStartChild = sinon.fake.returns("fake child");
const fakeSetContext = sinon.stub();
const fakeEndSpan = sinon.stub();

const reqService = proxyquire("../../utils/reqService.js", {
   "./telemetry": () => {
      return {
         startSpan: fakeStartSpan,
         startChildSpan: fakeStartChild,
         setContext: sinon.stub(),
         endSpan: fakeEndSpan,
      };
   },
});

let req;
const controller = {
   config: {},
   connections: {
      appbuilder: {
         database: "appbuilder",
      },
      site: {
         database: "site",
      },
   },
};
describe("ABRequestAPI", () => {
   beforeEach(() => {
      req = reqService({}, controller);
   });

   afterEach(() => {
      sinon.restore();
      fakeStartSpan.resetHistory();
      fakeStartChild.resetHistory();
      fakeEndSpan.resetHistory();
      fakeSetContext.resetHistory();
   });

   describe("instance attributes", () => {
      it("initializes a default jobID when created", function () {
         assert.exists(req.jobID);
         assert.equal(typeof req.jobID, "string");
      });
   });

   describe(".broadcast()", () => {
      let serviceRequest;
      const cb = sinon.fake();
      beforeEach(() => {
         serviceRequest = sinon.replace(
            req,
            "serviceRequest",
            sinon.fake.yields(null, "success")
         );
         cb.resetHistory();
      });

      it("sends a service request", () => {
         const packets = [{ room: "r", event: "e", data: {} }];
         req.broadcast(packets, cb);
         assert(serviceRequest.calledOnce);
         assert.equal(serviceRequest.firstCall.args[0], "api.broadcast");
         assert.deepEqual(serviceRequest.firstCall.args[1], packets);
         assert(cb.calledOnce);
      });

      it(".broadcast.inboxCreate()", async () => {
         const data = { inbox: "item" };
         await req.broadcast.inboxCreate(
            ["admin", "test"],
            ["role1", "role2"],
            data,
            cb
         );
         const packets = serviceRequest.firstCall.args[1];
         assert(serviceRequest.calledOnce);
         assert.equal(packets.length, 4);
         assert.deepEqual(packets[0], {
            data,
            event: "ab.inbox.create",
            room: "??-admin",
         });
         assert.deepEqual(packets[2], {
            data,
            event: "ab.inbox.create",
            room: "??-role1",
         });
         assert(cb.calledOnce);
      });

      it(".broadcast.dcCreate()", async () => {
         const data = { test: true };
         await req.broadcast.dcCreate("test_id", data, undefined, cb);
         const [packet] = serviceRequest.firstCall.args[1];
         assert(serviceRequest.calledOnce);
         assert.deepEqual(packet, {
            data: { objectId: "test_id", data },
            event: "ab.datacollection.create",
            room: "??-test_id",
         });
         assert(cb.calledOnce);
      });

      it(".broadcast.dcDelete()", async () => {
         await req.broadcast.dcDelete("test_id", "item_id", undefined, cb);
         const [packet] = serviceRequest.firstCall.args[1];
         assert(serviceRequest.calledOnce);
         assert.deepEqual(packet, {
            data: { objectId: "test_id", data: "item_id" },
            event: "ab.datacollection.delete",
            room: "??-test_id",
         });
         assert(cb.calledOnce);
      });

      it(".broadcast.dcUpdate()", async () => {
         const data = { test: true };
         await req.broadcast.dcUpdate("test_id", data, undefined, cb);
         const [packet] = serviceRequest.firstCall.args[1];
         assert(serviceRequest.calledOnce);
         assert.deepEqual(packet, {
            data: { objectId: "test_id", data },
            event: "ab.datacollection.update",
            room: "??-test_id",
         });
         assert(cb.calledOnce);
      });
   });

   describe(".configDB()", () => {
      it("returns site db config when no tenantID set", () => {
         assert.deepEqual(req.configDB(), controller.connections.site);
      });
      it("returns appbuilder db config when tenantID set", () => {
         req._tenantID = "tenantX";
         assert.deepEqual(req.configDB(), controller.connections.appbuilder);
      });
   });

   describe(".languageCode()", () => {
      it("returns 'en' by default", () => {
         assert.equal(req.languageCode(), "en");
      });
      it("returns users langauge code", () => {
         req._user = { languageCode: "th" };
         assert.deepEqual(req.languageCode(), "th");
      });
   });

   describe(".log()", () => {
      let log;
      beforeEach(() => (log = sinon.replace(console, "log", sinon.fake())));
      it("includes .jobID in our console output", () => {
         req.log("test");
         assert(log.calledOnce);
         assert.include(log.firstCall.firstArg, req.jobID);
      });

      it("log.verbose() hidden by default", () => {
         req.log.verbose("test");
         assert(log.notCalled);
      });

      it("log.verbose() shown with config.verbose setting", () => {
         req.controller.config.verbose = true;
         req.log.verbose("test");
         assert.equal(log.callCount, 1);
      });
   });

   describe(".notify()", () => {
      let notify;

      beforeEach(() => {
         notify = sinon.replace(req.__Notification, "notify", sinon.fake());
      });

      it("calls .__Notification.notify()", () => {
         const params = ["domain", new Error("test"), {}];
         req.notify(...params);
         assert(notify.calledOnceWith(...params));
      });

      it(".notify.developer() uses developer domain", () => {
         const params = [new Error("test"), {}];
         req.notify.developer(...params);
         assert(notify.calledOnceWith("developer", ...params));
      });

      it(".notify.builder() uses builder domain", () => {
         const params = [new Error("test"), {}];
         req.notify.builder(...params);
         assert(notify.calledOnceWith("builder", ...params));
      });
   });

   describe(".spanCreateChild()", () => {
      it("creates a child span based on the req span", () => {
         const fakeSpanRequest = sinon.replace(
            req,
            "spanRequest",
            sinon.fake.returns("child span")
         );
         const attributes = { op: "function" };
         req.spanCreateChild("child", attributes);
         assert(fakeSpanRequest.calledOnce);
         assert.equal(fakeSpanRequest.firstCall.firstArg, undefined);
         assert(fakeStartChild.calledOnce);
         assert.equal(fakeStartChild.firstCall.args[0], "child");
         assert.equal(fakeStartChild.firstCall.args[1], attributes);
         assert.equal(fakeStartChild.firstCall.args[2], "child span");
         assert(fakeStartSpan.notCalled);
      });
   });

   describe(".spanRequest()", () => {
      it("creates a telemetry span with args", () => {
         const args = { name: "test", op: "function" };
         req.spanRequest("my span", args);
         assert(fakeStartSpan.calledOnce);
         assert.equal(fakeStartSpan.firstCall.args[0], "my span");
         assert.equal(fakeStartSpan.firstCall.args[1], args);
         assert.equal(req._telemetrySpan, "fake span");
      });

      it("returns an existing telemetry span when called without args", () => {
         req._telemetrySpan = "exisiting span";
         const result = req.spanRequest();
         assert(fakeStartSpan.notCalled);
         assert.equal(result, "exisiting span");
      });
   });

   describe(".serviceRequest()", () => {
      it("calls .__Requester.request", () => {
         const request = sinon.replace(
            req.__Requester,
            "request",
            sinon.fake()
         );
         const params = ["key", { test: "data" }, { config: "1" }, () => {}];
         req.serviceRequest(...params);
         assert(request.calledOnceWith(...params));
      });
   });

   describe(".socketKey()", () => {
      it("retuns expected format", () => {
         req._tenantID = "test";
         assert.equal(req.socketKey("key1"), "test-key1");
      });
   });

   describe(".tenantDB()", () => {
      it("returns empty string when no tenant set", () => {
         assert.equal(req.tenantDB(), "");
      });
      it("returns correct format", () => {
         const escapeId = sinon.fake.returns("fakeResult");
         const dbConnection = sinon.replace(
            req,
            "dbConnection",
            sinon.fake.returns({ escapeId })
         );
         req._tenantID = "tenantX";
         assert(
            req.tenantDB(),
            "fakeResult",
            "Expect the response from dbConn.escapeId() which is faked"
         );
         assert(dbConnection.calledOnce);
         assert(escapeId.calledOnceWith("appbuilder-tenantX"));
      });
   });

   describe(".username()", () => {
      it("returns _system_ by default", () =>
         assert.equal(req.username(), "_system_"));

      it("returns users username", () => {
         req._user = { username: "admin" };
         assert.equal(req.username(), "admin");
      });
   });
});
