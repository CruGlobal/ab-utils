# ab-utils

## Modules

<dl>
<dt><a href="#module_ab-utils">ab-utils</a></dt>
<dd><p>a set of common utilities shared by each of our microsservices</p>
</dd>
<dt><a href="#module_dbConn">dbConn</a></dt>
<dd><p>manage and return a connection to our DB.
We will currently create a single Mysql Connection Pool and share that among
all our running operations.</p>
</dd>
</dl>

## Classes

<dl>
<dt><a href="#ABServiceController">ABServiceController</a> ⇐ <code>EventEmitter</code></dt>
<dd></dd>
<dt><a href="#ABRequestAPI">ABRequestAPI</a></dt>
<dd></dd>
<dt><a href="#ABRequestService">ABRequestService</a></dt>
<dd></dd>
<dt><a href="#ABServiceCote">ABServiceCote</a></dt>
<dd></dd>
<dt><a href="#ABResponseAPI">ABResponseAPI</a></dt>
<dd></dd>
<dt><a href="#ABService">ABService</a> ⇐ <code>EventEmitter</code></dt>
<dd></dd>
<dt><a href="#ABServiceRequest">ABServiceRequest</a> ⇐ <code><a href="#ABServiceCote">ABServiceCote</a></code></dt>
<dd></dd>
</dl>

## Constants

<dl>
<dt><a href="#cote">cote</a></dt>
<dd><p>reqServiceSubscriber
Subscribe to a Publisher&#39;s message stream.</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#validate_new
parse the {description} object and determine if the current req
instance passes the tests provided.

This fn_new will first use the {description} to build a joi
validator, and then evaluate the parameters using it.

Any missed validation rules will be stored internally and an
error can be retrieved using .errorValidation_new.

This fn_new returns {true} if all checks pass, or {false} otherwise.">validate()
parse the {description} object and determine if the current req
instance passes the tests provided.

This fn() will first use the {description} to build a joi
validator, and then evaluate the parameters using it.

Any missed validation rules will be stored internally and an
error can be retrieved using .errorValidation().

This fn() returns {true} if all checks pass, or {false} otherwise.(description, autoRespond, allParams)</a> ⇒ <code>bool</code></dt>
<dd></dd>
</dl>

<a name="module_ab-utils"></a>

## ab-utils
a set of common utilities shared by each of our microsservices


* [ab-utils](#module_ab-utils)
    * [.service](#module_ab-utils.service) ⇐ <code>EventEmitter</code>
        * [new service(options)](#new_module_ab-utils.service_new)
    * [.uuid()](#module_ab-utils.uuid) ⇒ <code>string</code>
    * [.config(baseFile)](#module_ab-utils.config) ⇒ <code>object</code>
    * [.controller([key])](#module_ab-utils.controller) ⇒ [<code>ABServiceController</code>](#ABServiceController)
    * [.reqApi(req, res, [config])](#module_ab-utils.reqApi) ⇒ [<code>ABRequestAPI</code>](#ABRequestAPI)
    * [.reqService(req, controller)](#module_ab-utils.reqService) ⇒ [<code>ABRequestService</code>](#ABRequestService)
    * [.resApi(req, res)](#module_ab-utils.resApi) ⇒ [<code>ABResponseAPI</code>](#ABResponseAPI)

<a name="module_ab-utils.service"></a>

### ab-utils.service ⇐ <code>EventEmitter</code>
Our ABService class

**Kind**: static class of [<code>ab-utils</code>](#module_ab-utils)  
**Extends**: <code>EventEmitter</code>  
**See**: [ABService](#ABService)  
<a name="new_module_ab-utils.service_new"></a>

#### new service(options)

| Param | Type | Default |
| --- | --- | --- |
| options | <code>obj</code> |  | 
| [options.name] | <code>string</code> | <code>&quot;ABService&quot;</code> | 

**Example**  
```js
const AB = require("ab.utils");
const options = { name: "myService"};
const service = new AB.service(options);
```
<a name="module_ab-utils.uuid"></a>

### ab-utils.uuid() ⇒ <code>string</code>
This is an alias for uuid.v4()

**Kind**: static method of [<code>ab-utils</code>](#module_ab-utils)  
**Returns**: <code>string</code> - uuid  
**See**: [uuid - npm](https://www.npmjs.com/package/uuid)  
<a name="module_ab-utils.config"></a>

### ab-utils.config(baseFile) ⇒ <code>object</code>
**Kind**: static method of [<code>ab-utils</code>](#module_ab-utils)  
**Returns**: <code>object</code> - baseConfig  

| Param | Type | Description |
| --- | --- | --- |
| baseFile | <code>string</code> | should be included as part of the project |

<a name="module_ab-utils.controller"></a>

### ab-utils.controller([key]) ⇒ [<code>ABServiceController</code>](#ABServiceController)
Get an AppBuilder Controller for use in our micro services

**Kind**: static method of [<code>ab-utils</code>](#module_ab-utils)  

| Param | Type | Default |
| --- | --- | --- |
| [key] | <code>string</code> | <code>&quot;ABServiceController&quot;</code> | 

<a name="module_ab-utils.reqApi"></a>

### ab-utils.reqApi(req, res, [config]) ⇒ [<code>ABRequestAPI</code>](#ABRequestAPI)
prepare a default set of data/utilities for our api request.
This request is established in the Sails api_sails service and is used
to verify and send jobs to various micro services.

**Kind**: static method of [<code>ab-utils</code>](#module_ab-utils)  

| Param | Type | Default |
| --- | --- | --- |
| req | <code>obj</code> |  | 
| res | <code>obj</code> |  | 
| [config] | <code>obj</code> | <code>{}</code> | 

<a name="module_ab-utils.reqService"></a>

### ab-utils.reqService(req, controller) ⇒ [<code>ABRequestService</code>](#ABRequestService)
return a modified req object that supports our typical AB functions.

**Kind**: static method of [<code>ab-utils</code>](#module_ab-utils)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>obj</code> | the standard request object received from the Cote service. |
| controller | [<code>ABServiceController</code>](#ABServiceController) |  |

<a name="module_ab-utils.resApi"></a>

### ab-utils.resApi(req, res) ⇒ [<code>ABResponseAPI</code>](#ABResponseAPI)
prepare a default set of data/utilities for our api response.

**Kind**: static method of [<code>ab-utils</code>](#module_ab-utils)  

| Param | Type |
| --- | --- |
| req | <code>object</code> | 
| res | <code>object</code> | 

<a name="module_dbConn"></a>

## dbConn
manage and return a connection to our DB.
We will currently create a single Mysql Connection Pool and share that among
all our running operations.

<a name="exp_module_dbConn--dbConn"></a>

### dbConn(req, shouldCreate, isolate) ⇒ <code>Pool</code> ⏏
**Kind**: Exported function  
**Returns**: <code>Pool</code> - from mysql  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| req | <code>reqService</code> |  | the current {reqService} object for this request |
| shouldCreate | <code>bool</code> | <code>true</code> | should we create a new DB connection if one isn't currently active? |
| isolate | <code>bool</code> | <code>false</code> | do we create a NEW connection and return that instead? |

<a name="ABServiceController"></a>

## ABServiceController ⇐ <code>EventEmitter</code>
**Kind**: global class  
**Extends**: <code>EventEmitter</code>  

* [ABServiceController](#ABServiceController) ⇐ <code>EventEmitter</code>
    * [new ABServiceController([key])](#new_ABServiceController_new)
    * [.exit()](#ABServiceController+exit)
    * [.init()](#ABServiceController+init)
    * [.afterShutdown(fn)](#ABServiceController+afterShutdown)
    * [.afterStartup(fn)](#ABServiceController+afterStartup)
    * [.beforeShutdown(fn)](#ABServiceController+beforeShutdown)
    * [.beforeStartup(fn)](#ABServiceController+beforeStartup)
    * [.ready()](#ABServiceController+ready)
    * [.requestObj(option)](#ABServiceController+requestObj) ⇒ <code>ABRequest</code>
    * [.shutdown()](#ABServiceController+shutdown)
    * [.startup()](#ABServiceController+startup)
    * [._waitForConfig()](#ABServiceController+_waitForConfig) ⇒ <code>Promise</code>
    * [._waitForDB()](#ABServiceController+_waitForDB) ⇒ <code>Promise</code>
    * [._waitForRedis()](#ABServiceController+_waitForRedis) ⇒ <code>Promise</code>

<a name="new_ABServiceController_new"></a>

### new ABServiceController([key])

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [key] | <code>string</code> | <code>&quot;ABServiceController&quot;</code> | key |

<a name="ABServiceController+exit"></a>

### controller.exit()
exit this service.

**Kind**: instance method of [<code>ABServiceController</code>](#ABServiceController)  
<a name="ABServiceController+init"></a>

### controller.init()
begin this service.

**Kind**: instance method of [<code>ABServiceController</code>](#ABServiceController)  
<a name="ABServiceController+afterShutdown"></a>

### controller.afterShutdown(fn)
**Kind**: instance method of [<code>ABServiceController</code>](#ABServiceController)  

| Param | Type |
| --- | --- |
| fn | <code>function</code> | 

<a name="ABServiceController+afterStartup"></a>

### controller.afterStartup(fn)
**Kind**: instance method of [<code>ABServiceController</code>](#ABServiceController)  

| Param | Type |
| --- | --- |
| fn | <code>function</code> | 

<a name="ABServiceController+beforeShutdown"></a>

### controller.beforeShutdown(fn)
**Kind**: instance method of [<code>ABServiceController</code>](#ABServiceController)  

| Param | Type |
| --- | --- |
| fn | <code>function</code> | 

<a name="ABServiceController+beforeStartup"></a>

### controller.beforeStartup(fn)
**Kind**: instance method of [<code>ABServiceController</code>](#ABServiceController)  

| Param | Type |
| --- | --- |
| fn | <code>function</code> | 

<a name="ABServiceController+ready"></a>

### controller.ready()
Send a 'ready' signal on this process. Useful for service managers
(like pm2) to know the process is ready.

**Kind**: instance method of [<code>ABServiceController</code>](#ABServiceController)  
<a name="ABServiceController+requestObj"></a>

### controller.requestObj(option) ⇒ <code>ABRequest</code>
return a new ABRequest() object.

**Kind**: instance method of [<code>ABServiceController</code>](#ABServiceController)  

| Param | Type | Description |
| --- | --- | --- |
| option | <code>json</code> | any initial settings for the {ABRequest} obj |

<a name="ABServiceController+shutdown"></a>

### controller.shutdown()
the process a service should perform to gracefully shutdown.

**Kind**: instance method of [<code>ABServiceController</code>](#ABServiceController)  
<a name="ABServiceController+startup"></a>

### controller.startup()
the process a service should perform to startup.

**Kind**: instance method of [<code>ABServiceController</code>](#ABServiceController)  
<a name="ABServiceController+_waitForConfig"></a>

### controller.\_waitForConfig() ⇒ <code>Promise</code>
waits until the config service has posted a '.config_ready' file

**Kind**: instance method of [<code>ABServiceController</code>](#ABServiceController)  
<a name="ABServiceController+_waitForDB"></a>

### controller.\_waitForDB() ⇒ <code>Promise</code>
attempts to connect to our maria DB service before continuing.

**Kind**: instance method of [<code>ABServiceController</code>](#ABServiceController)  
<a name="ABServiceController+_waitForRedis"></a>

### controller.\_waitForRedis() ⇒ <code>Promise</code>
attempts to connect to our redis server and then resolves() once the connection is ready.

**Kind**: instance method of [<code>ABServiceController</code>](#ABServiceController)  
<a name="ABRequestAPI"></a>

## ABRequestAPI
**Kind**: global class  

* [ABRequestAPI](#ABRequestAPI)
    * [new ABRequestAPI(req, res, [config])](#new_ABRequestAPI_new)
    * [.switcherooToUser(user)](#ABRequestAPI+switcherooToUser)
    * [.userDefaults()](#ABRequestAPI+userDefaults) ⇒ <code>obj</code>
    * [.tenantSet()](#ABRequestAPI+tenantSet) ⇒ <code>bool</code>
    * [.log(...args)](#ABRequestAPI+log)
    * [.param(key)](#ABRequestAPI+param) ⇒ <code>string</code>
    * [.servicePublish(key, data, cb)](#ABRequestAPI+servicePublish)
    * [.serviceRequest(key, data, cb)](#ABRequestAPI+serviceRequest)
    * [.serviceResponder(key, handler)](#ABRequestAPI+serviceResponder)
    * [.serviceSubscribe(key, handler)](#ABRequestAPI+serviceSubscribe)
    * [.socketKey(key)](#ABRequestAPI+socketKey) ⇒ <code>string</code>

<a name="new_ABRequestAPI_new"></a>

### new ABRequestAPI(req, res, [config])

| Param | Type | Default |
| --- | --- | --- |
| req | <code>Object</code> |  | 
| res | <code>Object</code> |  | 
| [config] | <code>Object</code> | <code>{}</code> | 

<a name="ABRequestAPI+switcherooToUser"></a>

### req.switcherooToUser(user)
allow the current user to impersonate the provided user.

**Kind**: instance method of [<code>ABRequestAPI</code>](#ABRequestAPI)  

| Param | Type |
| --- | --- |
| user | <code>json:SiteUser</code> | 

<a name="ABRequestAPI+userDefaults"></a>

### req.userDefaults() ⇒ <code>obj</code>
return a data structure used by our ABModel.find() .create() .update()
.delete() operations that needs credentials for the current User
driving this request.

**Kind**: instance method of [<code>ABRequestAPI</code>](#ABRequestAPI)  
**Returns**: <code>obj</code> - .languageCode: {string} the default language code of the user
         .usernam: {string} the .username of the user for Identification.  
<a name="ABRequestAPI+tenantSet"></a>

### req.tenantSet() ⇒ <code>bool</code>
tenantSet()

**Kind**: instance method of [<code>ABRequestAPI</code>](#ABRequestAPI)  
**Returns**: <code>bool</code> - value if the tenantID is set.  
<a name="ABRequestAPI+log"></a>

### req.log(...args)
format our output logs to include our jobID with our message.

**Kind**: instance method of [<code>ABRequestAPI</code>](#ABRequestAPI)  

| Param | Type | Description |
| --- | --- | --- |
| ...args | <code>\*</code> | anything to log (will be stringified) |

<a name="ABRequestAPI+param"></a>

### req.param(key) ⇒ <code>string</code>
param()
An interface to return the requested input value.
If that value has already been processed by our .validateParameters()
we pull that value from there.  Otherwise we ask the provided req object
for the value.

**Kind**: instance method of [<code>ABRequestAPI</code>](#ABRequestAPI)  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | The identifying parameter key |

<a name="ABRequestAPI+servicePublish"></a>

### req.servicePublish(key, data, cb)
servicePublish()
Publish an update to other subscribed services.

**Kind**: instance method of [<code>ABRequestAPI</code>](#ABRequestAPI)  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | the channel we are updating. |
| data | <code>json</code> | the data packet to send to the subscribers. |
| cb | <code>fn</code> | a node.js style callback(err, result) for when the response        is received. |

<a name="ABRequestAPI+serviceRequest"></a>

### req.serviceRequest(key, data, cb)
serviceRequest()
Send a request to another micro-service using the cote protocol.

**Kind**: instance method of [<code>ABRequestAPI</code>](#ABRequestAPI)  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | the service handler's key we are sending a request to. |
| data | <code>json</code> | the data packet to send to the service. |
| cb | <code>fn</code> | a node.js style callback(err, result) for when the response        is received. |

<a name="ABRequestAPI+serviceResponder"></a>

### req.serviceResponder(key, handler)
serviceResponder()
Create a Cote service responder that can parse our data interchange
format.

**Kind**: instance method of [<code>ABRequestAPI</code>](#ABRequestAPI)  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | the service handler's key we are responding to. |
| handler | <code>fn</code> | a function to handle the incoming request. The function will        receive 2 parameters: fn(req, cb)          req: an instance of the ABRequest appropriate for the current               context.          cb:  a node.js style callback(err, result) for responding to               the requester. |

<a name="ABRequestAPI+serviceSubscribe"></a>

### req.serviceSubscribe(key, handler)
serviceSubscribe()
Create a Cote service subscriber that can parse our data interchange
format.

**Kind**: instance method of [<code>ABRequestAPI</code>](#ABRequestAPI)  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | the service handler's key we are responding to. |
| handler | <code>fn</code> | a function to handle the incoming request. The function will        receive 1 parameters: fn(req)          req: an instance of the ABRequest appropriate for the current               context. |

<a name="ABRequestAPI+socketKey"></a>

### req.socketKey(key) ⇒ <code>string</code>
socketKey()
make sure any socket related key is prefixed by our tenantID

**Kind**: instance method of [<code>ABRequestAPI</code>](#ABRequestAPI)  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | The socket key we are wanting to reference. |

<a name="ABRequestService"></a>

## ABRequestService
**Kind**: global class  

* [ABRequestService](#ABRequestService)
    * [new ABRequestService(req, controller)](#new_ABRequestService_new)
    * [.configDB()](#ABRequestService+configDB)
    * [.dbConnection(create, isolate)](#ABRequestService+dbConnection) ⇒ <code>Mysql.conn</code> \| <code>null</code>
    * [.languageCode()](#ABRequestService+languageCode) ⇒ <code>string</code>
    * [.log(...allArgs)](#ABRequestService+log)
    * [.logError(...allArgs)](#ABRequestService+logError)
    * [.model(name)](#ABRequestService+model) ⇒ <code>Model</code> \| <code>null</code>
    * [.param(key)](#ABRequestService+param) ⇒ <code>\*</code> \| <code>undefined</code>
    * [.query(query, values, cb, dbConn)](#ABRequestService+query)
    * [.queryTenantDB(reject)](#ABRequestService+queryTenantDB) ⇒ <code>false</code> \| <code>string</code>
    * [.queryWhereCondition(cond)](#ABRequestService+queryWhereCondition) ⇒ <code>obj</code>
    * [.servicePublish(key, data, cb)](#ABRequestService+servicePublish)
    * [.serviceRequest(key, data, [options], [cb])](#ABRequestService+serviceRequest) ⇒ <code>Promise</code>
    * [.serviceSubscribe(key, handler)](#ABRequestService+serviceSubscribe)
    * [.socketKey(key)](#ABRequestService+socketKey) ⇒ <code>string</code>
    * [.tenantDB()](#ABRequestService+tenantDB) ⇒ <code>string</code>
    * [.tenantID()](#ABRequestService+tenantID) ⇒ <code>string</code>

<a name="new_ABRequestService_new"></a>

### new ABRequestService(req, controller)

| Param | Type |
| --- | --- |
| req | <code>onject</code> | 
| controller | [<code>ABServiceController</code>](#ABServiceController) | 

<a name="ABRequestService+configDB"></a>

### req.configDB()
configDB()
return the proper DB connection data for the current request.
If the request HAS a tenantID, we return the 'appbuilder' connection,
If no tenantID, then we return the 'site' connection.

**Kind**: instance method of [<code>ABRequestService</code>](#ABRequestService)  
<a name="ABRequestService+dbConnection"></a>

### req.dbConnection(create, isolate) ⇒ <code>Mysql.conn</code> \| <code>null</code>
dbConnection()
return a connection to our mysql DB for the current request:

**Kind**: instance method of [<code>ABRequestService</code>](#ABRequestService)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| create | <code>bool</code> | <code>true</code> | create a new DB connection if we are not currently connected. |
| isolate | <code>bool</code> | <code>false</code> | return a unique DB connection not shared by other requests. |

<a name="ABRequestService+languageCode"></a>

### req.languageCode() ⇒ <code>string</code>
languageCode()
return the current language settings for this request.

**Kind**: instance method of [<code>ABRequestService</code>](#ABRequestService)  
<a name="ABRequestService+log"></a>

### req.log(...allArgs)
log()
print out a log entry for the current request

**Kind**: instance method of [<code>ABRequestService</code>](#ABRequestService)  

| Param | Type | Description |
| --- | --- | --- |
| ...allArgs | <code>\*</code> | array of possible log entries |

<a name="ABRequestService+logError"></a>

### req.logError(...allArgs)
logError()
print out a log entry for the current request

**Kind**: instance method of [<code>ABRequestService</code>](#ABRequestService)  

| Param | Type | Description |
| --- | --- | --- |
| ...allArgs | <code>\*</code> | array of possible log entries |

<a name="ABRequestService+model"></a>

### req.model(name) ⇒ <code>Model</code> \| <code>null</code>
model(name)
Return a Model() instance from the model/name.js definition

**Kind**: instance method of [<code>ABRequestService</code>](#ABRequestService)  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | name of the model/[name].js definition to return a Model for. |

<a name="ABRequestService+param"></a>

### req.param(key) ⇒ <code>\*</code> \| <code>undefined</code>
param(key)
return the parameter value specified by the provided key

**Kind**: instance method of [<code>ABRequestService</code>](#ABRequestService)  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | name of the req.param[key] value to return |

<a name="ABRequestService+query"></a>

### req.query(query, values, cb, dbConn)
query()
perform an sql query directly on our dbConn.

**Kind**: instance method of [<code>ABRequestService</code>](#ABRequestService)  

| Param | Type | Description |
| --- | --- | --- |
| query | <code>string</code> | the sql query to perform.  Use "?" for placeholders. |
| values | <code>array</code> | the array of values that correspond to the placeholders in the sql |
| cb | <code>fn</code> | a node style callback with 3 paramaters (error, results, fields)        these are the same values as returned by the mysql library .query() |
| dbConn | <code>MySQL</code> | [optional]        the DB Connection to use for this request. If not provided the        common dbConnection() will be used. |

<a name="ABRequestService+queryTenantDB"></a>

### req.queryTenantDB(reject) ⇒ <code>false</code> \| <code>string</code>
queryTenantDB()
return the tenantDB value for this req object.
this is a helper function that simplifies the error handling if no
tenantDB is found.

**Kind**: instance method of [<code>ABRequestService</code>](#ABRequestService)  
**Returns**: <code>false</code> \| <code>string</code> - false : if not tenantDB is found
       string: the tenantDB name.  

| Param | Type | Description |
| --- | --- | --- |
| reject | <code>Promise.reject</code> | a reject() handler to be called if a tenantDB is not found. |

<a name="ABRequestService+queryWhereCondition"></a>

### req.queryWhereCondition(cond) ⇒ <code>obj</code>
queryWhereCondition(cond)
evaluate a given {cond} hash and generate an SQL condition string
from it.
This fn() returns both the sql condition string, and an array of
values that correspond to the proper ordering of the condition

**Kind**: instance method of [<code>ABRequestService</code>](#ABRequestService)  
**Returns**: <code>obj</code> - <br>.condition {string}  the proper sql "WHERE ${condition}"
              <br>.values {array} the values to fill in the condition placeholders  

| Param | Type | Description |
| --- | --- | --- |
| cond | <code>obj</code> | a value hash of the desired condition. |

<a name="ABRequestService+servicePublish"></a>

### req.servicePublish(key, data, cb)
servicePublish()
Publish an update to other subscribed services.

**Kind**: instance method of [<code>ABRequestService</code>](#ABRequestService)  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | the channel we are updating. |
| data | <code>json</code> | the data packet to send to the subscribers. |
| cb | <code>fn</code> | a node.js style callback(err, result) for when the response        is received. |

<a name="ABRequestService+serviceRequest"></a>

### req.serviceRequest(key, data, [options], [cb]) ⇒ <code>Promise</code>
Send a request to another micro-service using the cote protocol. Accept an
optional callback, but also returns a promise.

**Kind**: instance method of [<code>ABRequestService</code>](#ABRequestService)  
**Returns**: <code>Promise</code> - resolves with the response from the service  
**Fucntion**: serviceRequest  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| key | <code>string</code> |  | the service handler's key we are sending a request to. |
| data | <code>json</code> |  | the data packet to send to the service. |
| [options] | <code>object</code> |  | options |
| [options.timeout] | <code>number</code> | <code>5000</code> | ms to wait before timing out |
| [options.maxAttempts] | <code>number</code> | <code>5</code> | how many times to try the request if  it fails |
| [options.longRequest] | <code>boolean</code> | <code>false</code> | timeout after 90 seconds, will be ignored if timeout was set |
| [cb] | <code>function</code> |  | node.js style callback(err, result) for when the response is received. |

**Example**  
```js
// async/await
try {
   let result = await serviceRequest(key, data);
} catch (err) {}
// promise
serviceRequest(key, data, opts).then((result) => {}).catch((err) => {})
// callback
serviceRequest(key, data, opts, (result, err) => {})
// or
serviceRequest(key, data, (result, err) => {})
```
<a name="ABRequestService+serviceSubscribe"></a>

### req.serviceSubscribe(key, handler)
serviceSubscribe()
Create a Cote service subscriber that can parse our data interchange
format.

**Kind**: instance method of [<code>ABRequestService</code>](#ABRequestService)  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | the service handler's key we are responding to. |
| handler | <code>fn</code> | a function to handle the incoming request. The function will        receive 1 parameters: fn(req)          req: an instance of the ABRequest appropriate for the current               context. |

<a name="ABRequestService+socketKey"></a>

### req.socketKey(key) ⇒ <code>string</code>
socketKey()
make sure any socket related key is prefixed by our tenantID

**Kind**: instance method of [<code>ABRequestService</code>](#ABRequestService)  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | The socket key we are wanting to reference. |

<a name="ABRequestService+tenantDB"></a>

### req.tenantDB() ⇒ <code>string</code>
tenantDB()
return the database reference for the current Tenant

**Kind**: instance method of [<code>ABRequestService</code>](#ABRequestService)  
<a name="ABRequestService+tenantID"></a>

### req.tenantID() ⇒ <code>string</code>
tenantID()
return the tenantID of the current request

**Kind**: instance method of [<code>ABRequestService</code>](#ABRequestService)  
<a name="ABServiceCote"></a>

## ABServiceCote
**Kind**: global class  
<a name="ABServiceCote+toParam"></a>

### abServiceCote.toParam(key, data)
toParam()
repackage the current data into a common format between our services

**Kind**: instance method of [<code>ABServiceCote</code>](#ABServiceCote)  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | The cote request key that identifies which service we are sending 			our request to. |
| data | <code>json</code> | The data packet we are providing to the service. |

<a name="ABResponseAPI"></a>

## ABResponseAPI
**Kind**: global class  
<a name="new_ABResponseAPI_new"></a>

### new ABResponseAPI(req, res)

| Param | Type |
| --- | --- |
| req | <code>object</code> | 
| res | <code>object</code> | 

<a name="ABService"></a>

## ABService ⇐ <code>EventEmitter</code>
**Kind**: global class  
**Extends**: <code>EventEmitter</code>  

* [ABService](#ABService) ⇐ <code>EventEmitter</code>
    * [new ABService(options)](#new_ABService_new)
    * [.ready()](#ABService+ready)
    * [.run()](#ABService+run)
    * [.shutdown()](#ABService+shutdown)
    * [.startup()](#ABService+startup)

<a name="new_ABService_new"></a>

### new ABService(options)
Define a common AppBuilder Service class for use in our micro services.


| Param | Type | Default |
| --- | --- | --- |
| options | <code>obj</code> |  | 
| [options.name] | <code>string</code> | <code>&quot;ABService&quot;</code> | 

<a name="ABService+ready"></a>

### abService.ready()
ready
Send a 'ready' signal on this process. Useful for service managers
(like pm2) to know the process is ready.

**Kind**: instance method of [<code>ABService</code>](#ABService)  
<a name="ABService+run"></a>

### abService.run()
run
the operation of the Service.  It will be run after the .startup()
routine is completed.

**Kind**: instance method of [<code>ABService</code>](#ABService)  
<a name="ABService+shutdown"></a>

### abService.shutdown()
shutdown
the process a service should perform to gracefully shutdown.

**Kind**: instance method of [<code>ABService</code>](#ABService)  
<a name="ABService+startup"></a>

### abService.startup()
startup
the process a service should perform to startup.

**Kind**: instance method of [<code>ABService</code>](#ABService)  
<a name="ABServiceRequest"></a>

## ABServiceRequest ⇐ [<code>ABServiceCote</code>](#ABServiceCote)
**Kind**: global class  
**Extends**: [<code>ABServiceCote</code>](#ABServiceCote)  

* [ABServiceRequest](#ABServiceRequest) ⇐ [<code>ABServiceCote</code>](#ABServiceCote)
    * [.request(key, data, [options], [cb])](#ABServiceRequest+request) ⇒ <code>Promise</code>
    * [.getRequester(domain, long)](#ABServiceRequest+getRequester)
    * [.toParam(key, data)](#ABServiceCote+toParam)

<a name="ABServiceRequest+request"></a>

### abServiceRequest.request(key, data, [options], [cb]) ⇒ <code>Promise</code>
Send a request to another micro-service using the cote protocol. Accept an
optional callback, but also returns a promise.

**Kind**: instance method of [<code>ABServiceRequest</code>](#ABServiceRequest)  
**Returns**: <code>Promise</code> - resolves with the response from the service  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| key | <code>string</code> |  | the service handler's key we are sending a request to. |
| data | <code>json</code> |  | the data packet to send to the service. |
| [options] | <code>object</code> |  | optional options |
| [options.timeout] | <code>number</code> | <code>5000</code> | ms to wait before timing out |
| [options.maxAttempts] | <code>number</code> | <code>5</code> | how many times to try the request if  it fails |
| [options.longRequest] | <code>boolean</code> | <code>false</code> | timeout after 90 seconds, will be ignored if timeout was set |
| [cb] | <code>function</code> |  | optional node.js style callback(err, result) for when the response is received. |

**Example**  
```js
// async/await
try {
   let result = await request(key, data);
} catch (err) {}
// promise
request(key, data, opts).then((result) => {}).catch((err) => {})
// callback
request(key, data, opts, (result, err) => {})
// or
request(key, data, (result, err) => {})
```
<a name="ABServiceRequest+getRequester"></a>

### abServiceRequest.getRequester(domain, long)
Gets a cached requester for the domain, creating one if needed

**Kind**: instance method of [<code>ABServiceRequest</code>](#ABServiceRequest)  

| Param | Type | Description |
| --- | --- | --- |
| domain | <code>string</code> | cote domain key |
| long | <code>boolean</code> | whether the requester needs a longer timeout |

<a name="ABServiceCote+toParam"></a>

### abServiceRequest.toParam(key, data)
toParam()
repackage the current data into a common format between our services

**Kind**: instance method of [<code>ABServiceRequest</code>](#ABServiceRequest)  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | The cote request key that identifies which service we are sending 			our request to. |
| data | <code>json</code> | The data packet we are providing to the service. |

<a name="cote"></a>

## cote
reqServiceSubscriberSubscribe to a Publisher's message stream.

**Kind**: global constant  
<a name="validate_new
parse the {description} object and determine if the current req
instance passes the tests provided.

This fn_new will first use the {description} to build a joi
validator, and then evaluate the parameters using it.

Any missed validation rules will be stored internally and an
error can be retrieved using .errorValidation_new.

This fn_new returns {true} if all checks pass, or {false} otherwise."></a>

## validate()
parse the {description} object and determine if the current req
instance passes the tests provided.

This fn() will first use the {description} to build a joi
validator, and then evaluate the parameters using it.

Any missed validation rules will be stored internally and an
error can be retrieved using .errorValidation().

This fn() returns {true} if all checks pass, or {false} otherwise.(description, autoRespond, allParams) ⇒ <code>bool</code>
**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| description | <code>hash</code> | An object hash describing the validation checks to use. At        the top level the Hash is: { [paramName] : {ruleHash} }        Each {ruleHash} follows this format:        "parameterName" : {           {joi.fn}  : true,  // performs: joi.{fn}();            {joi.fn} : {              {joi.fn1} : true,   // performs: joi.{fn}().{fn1}();              {joi.fn2} : { options } // performs: joi.{fn}().{fn2}({options})            }            // examples:            "required" : {bool},  // default = false            // custom:            "validate" : {fn} a function(value, {allValues hash}) that                           returns { error:{null || {new Error("Error Message")} }, value: {normalize(value)}}         } |
| autoRespond | <code>bool</code> | if {true} will auto respond on errors with the {res} object. |
| allParams | <code>hash</code> | if you want to limit the parameters .validateParameters()        evaluates, then pass in the values as a { "param" : {value} }        hash.        if not provided, then we use the req.allParams() to retrieve        the parameters to evaluate. |

