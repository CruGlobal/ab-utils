[![CodeQL](https://github.com/digi-serve/ab-utils/actions/workflows/codeql.yml/badge.svg)](https://github.com/digi-serve/ab-utils/actions/workflows/codeql.yml) [![Unit](https://github.com/digi-serve/ab-utils/actions/workflows/unit-test.yml/badge.svg)](https://github.com/digi-serve/ab-utils/actions/workflows/unit-test.yml)
    <a name="module_ab-utils"></a>

## ab-utils
a set of common utilities shared by each of our microsservices


* [ab-utils](#module_ab-utils)
    * [.service](#module_ab-utils.service) ⇐ <code>EventEmitter</code>
        * [new service(options)](#new_module_ab-utils.service_new)
    * [.uuid()](#module_ab-utils.uuid) ⇒ <code>string</code>
    * [.config(baseFile)](#module_ab-utils.config) ⇒ <code>object</code>
    * [.controller([key])](#module_ab-utils.controller) ⇒ [<code>ABServiceController</code>](./docs/ABServiceController.md#ABServiceController)
    * [.reqApi(req, res, [config])](#module_ab-utils.reqApi) ⇒ [<code>ABRequestAPI</code>](./docs/ABRequestAPI.md#ABRequestAPI)
    * [.reqService(req, controller)](#module_ab-utils.reqService) ⇒ [<code>ABRequestService</code>](./docs/ABRequestService.md#ABRequestService)
    * [.resApi(req, res)](#module_ab-utils.resApi) ⇒ [<code>ABResponseAPI</code>](./docs/ABResponseAPI.md#ABResponseAPI)

<a name="module_ab-utils.service"></a>

### ab-utils.service ⇐ <code>EventEmitter</code>
Our ABService class

**Kind**: static class of [<code>ab-utils</code>](#module_ab-utils)  
**Extends**: <code>EventEmitter</code>  
**See**: [ABService](./docs/ABService.md#ABService)  
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

### ab-utils.controller([key]) ⇒ [<code>ABServiceController</code>](./docs/ABServiceController.md#ABServiceController)
Get an AppBuilder Controller for use in our micro services

**Kind**: static method of [<code>ab-utils</code>](#module_ab-utils)  

| Param | Type | Default |
| --- | --- | --- |
| [key] | <code>string</code> | <code>&quot;ABServiceController&quot;</code> | 

<a name="module_ab-utils.reqApi"></a>

### ab-utils.reqApi(req, res, [config]) ⇒ [<code>ABRequestAPI</code>](./docs/ABRequestAPI.md#ABRequestAPI)
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

### ab-utils.reqService(req, controller) ⇒ [<code>ABRequestService</code>](./docs/ABRequestService.md#ABRequestService)
return a modified req object that supports our typical AB functions.

**Kind**: static method of [<code>ab-utils</code>](#module_ab-utils)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>obj</code> | the standard request object received from the Cote service. |
| controller | [<code>ABServiceController</code>](./docs/ABServiceController.md#ABServiceController) |  |

<a name="module_ab-utils.resApi"></a>

### ab-utils.resApi(req, res) ⇒ [<code>ABResponseAPI</code>](./docs/ABResponseAPI.md#ABResponseAPI)
prepare a default set of data/utilities for our api response.

**Kind**: static method of [<code>ab-utils</code>](#module_ab-utils)  

| Param | Type |
| --- | --- |
| req | <code>object</code> | 
| res | <code>object</code> | 


## Classes
 - [ABServiceController](./docs/ABServiceController.md)
 - [ABRequestAPI](./docs/ABRequestAPI.md)
 - [ABNotification](./docs/ABNotification.md)
 - [ABRequestService](./docs/ABRequestService.md)
 - [ABServiceCote](./docs/ABServiceCote.md)
 - [ABServicePublish](./docs/ABServicePublish.md)
 - [ABServiceResponder](./docs/ABServiceResponder.md)
 - [ABServiceSubscriber](./docs/ABServiceSubscriber.md)
 - [ABResponseAPI](./docs/ABResponseAPI.md)
 - [ABService](./docs/ABService.md)
 - [ABServiceRequest](./docs/ABServiceRequest.md)