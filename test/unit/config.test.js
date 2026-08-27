const assert = require("assert");
const path = require("path");

const config = require("../../utils/config.js");

describe("config", () => {
   let originalCwd;

   before(() => {
      originalCwd = process.cwd();
      process.chdir(path.join(__dirname, "..", "fixtures"));
   });

   after(() => {
      process.chdir(originalCwd);
   });

   it("returns a config", async () => {
      const one = await config("one");
      const two = await config();
      assert.deepEqual(one, { example: "config" });
      assert.deepEqual(two, { one: { example: "config" } });
   });
});
