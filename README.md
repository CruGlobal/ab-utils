[![CodeQL](https://github.com/CruGlobal/ab-utils/actions/workflows/codeql.yml/badge.svg)](https://github.com/CruGlobal/ab-utils/actions/workflows/codeql.yml) [![Unit](https://github.com/CruGlobal/ab-utils/actions/workflows/unit-test.yml/badge.svg)](https://github.com/CruGlobal/ab-utils/actions/workflows/unit-test.yml) [![npm (scoped)](https://img.shields.io/npm/v/@digiserve/ab-utils)](https://www.npmjs.com/package/@digiserve/ab-utils)
    <a name="module_ab-utils"></a>

## ab-utils
a set of common utilities shared by each of our micro-services


* [ab-utils](#module_ab-utils)
    * [.service](#module_ab-utils.service) ⇐ <code>EventEmitter</code>
        * [new service(options)](#new_module_ab-utils.service_new)
    * [.uuid()](#module_ab-utils.uuid) ⇒ <code>string</code>
    * [.config(key)](#module_ab-utils.config) ⇒ <code>Promise.&lt;object&gt;</code>
    * [.controller([key])](#module_ab-utils.controller) ⇒ [<code>ABServiceController</code>](./docs/ABServiceController.md#ABServiceController)
    * [.telemetry()](#module_ab-utils.telemetry) ⇒ [<code>Telemetry</code>](./docs/Telemetry.md#Telemetry)
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

### ab-utils.config(key) ⇒ <code>Promise.&lt;object&gt;</code>
**Kind**: static method of [<code>ab-utils</code>](#module_ab-utils)  
**Returns**: <code>Promise.&lt;object&gt;</code> - baseConfig  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | [optional] a subportion of the configs specified |

<a name="module_ab-utils.controller"></a>

### ab-utils.controller([key]) ⇒ [<code>ABServiceController</code>](./docs/ABServiceController.md#ABServiceController)
Get an AppBuilder Controller for use in our micro services

**Kind**: static method of [<code>ab-utils</code>](#module_ab-utils)  

| Param | Type | Default |
| --- | --- | --- |
| [key] | <code>string</code> | <code>&quot;ABServiceController&quot;</code> | 

<a name="module_ab-utils.telemetry"></a>

### ab-utils.telemetry() ⇒ [<code>Telemetry</code>](./docs/Telemetry.md#Telemetry)
Get the telemetry interface

**Kind**: static method of [<code>ab-utils</code>](#module_ab-utils)  
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
 - [telemetrySentry](./docs/telemetrySentry.md)
 - [TelemetryOpenTelemetry](./docs/TelemetryOpenTelemetry.md)
 - [TelemetryDefault](./docs/TelemetryDefault.md)
 - [Telemetry](./docs/Telemetry.md)
 - [ABServiceRequest](./docs/ABServiceRequest.md)
 - [ABService](./docs/ABService.md)
 - [ABResponseAPI](./docs/ABResponseAPI.md)
 - [ABServiceSubscriber](./docs/ABServiceSubscriber.md)
 - [ABServiceResponder](./docs/ABServiceResponder.md)
 - [ABServicePublish](./docs/ABServicePublish.md)
 - [ABServiceCote](./docs/ABServiceCote.md)
 - [ABRequestService](./docs/ABRequestService.md)
 - [ABNotification](./docs/ABNotification.md)
 - [ABRequestAPI](./docs/ABRequestAPI.md)
 - [ABServiceController](./docs/ABServiceController.md)
 - [DefaultVersionHandler](./docs/DefaultVersionHandler.md)
 - [DefaultHealthcheck](./docs/DefaultHealthcheck.md)