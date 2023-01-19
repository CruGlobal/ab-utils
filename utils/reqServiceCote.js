/// reqServiceCote.js
///
const shortid = require("shortid");
class ABServiceCote {
   constructor(req) {
      this.req = req;
   }

   /**
    * toParam()
    * repackage the current data into a common format between our services
    * @param {string} key
    *			The cote request key that identifies which service we are sending
    *			our request to.
    * @param {json} data
    *			The data packet we are providing to the service.
    */
   toParam(key, data) {
      data = data || {};
      return {
         type: key,
         param: {
            jobID: this.req.jobID,
            requestID: shortid.generate(),
            tenantID: this.req._tenantID,
            user: this.req._user,
            userReal: this.req._userReal,
            data,
         },
      };
   }
}

module.exports = ABServiceCote;
