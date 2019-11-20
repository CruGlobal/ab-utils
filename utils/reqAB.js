/*
 * reqAB
 * prepare a default set of data/utilities for our api request.
 */
const shortid = require("shortid");
module.exports = function() {
    return {
        jobID: shortid.generate(),
        log: function(...allArgs) {
            var args = [];
            allArgs.forEach((a) => {
                args.push(JSON.stringify(a));
            });
            console.log(`${this.jobID}::${args.join(" ")}`);
        },
        toParam: function(key, data) {
            data = data || {};
            return {
                type: key,
                param: {
                    jobID: this.jobID,
                    data
                }
            };
        }
    };
};
