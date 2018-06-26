Curveball
=========

Curveball is a framework for building web services in Node.js. It fullfills a
similar role to [Express][1] and it's heavily inspired by [Koa][2].

This web framework has the following goals:

* A minimal foundation.
* Completely written in and for [TypeScript][3].
* Modern Ecmascript features.
* Async/await-based middleware.
* Native support for HTTP/2, including easy access to HTTP/2 Push.
* Native support for modern HTTP features, such as [`103 Early Hints`][4].

If you used Koa in the past, this is going to look pretty familiar. I'm a big
fan of Koa myself and would recommend it over this project if you don't need
any of the things this project offers.

Installation
------------

    npm install curveball


Getting started
---------------

Curveball only provides a basic framework. Using it means implementing or
using curveball middleware. For example, if you want a router, use or build
a Router middleware.

All of the following examples are written in typescript, but it is also
possible to use the framework with plain javascript.

```typescript
import { Application, Context } from 'curveball';

const app = new Curveball();
app.use((ctx: Context) => {

  ctx.response.status = 200;
  ctx.body = 'Hello world!'

});
```

Sending 1xx Informational responses
-----------------------------------

Curveball has native support for sending informational responses. Examples are:

* [`100 Continue`][http-100] to let a client know even before the request
  completed that it makes sense to continue, or that it should break off the
  request.
* [`102 Processing`][http-102] to periodically indicate that the server is
  still working on the response. This might not be very useful anymore.
* [`103 Early Hints`][http-103] a new standard to let a client or proxy know
  early in the process that some headers might be coming, allowing clients or
  proxies to for example pre-fetch certain resources even before the initial
  request completes.

Here's an example of a middleware using `103 Early Hints`:

```typescript
import { Application, Context, Middleware } from 'curveball';

const app = new Curveball();
app.use(async (ctx: Context, next: Middleware) => {

  await ctx.response.sendInformational(103, {
    'Link' : [
      '</style.css> rel="prefetch" as="style"',
      '</script.js> rel="prefetch" as="script"',
    ]
  });
  await next();

});
```

API
---


### The Context class

The Context object has the following properties:

* `request` - An instance of `Request`.
* `response` - An instance of `Response`.
* `state` - An object you can use to store request-specific state information.
  this object can be used to pass information between middlewares. A common
  example is that an authentication middlware might set 'currently logged in
  user' information here.


### The Request interface

The Request interface represents the HTTP request. It has the following
properties and methods:

* `headers` - An instance of `Headers`.
* `path` - The path of the request, for example `/foo.html`.
* `method` - For example, `POST`.
* `requestTarget` - The full `requestTarget` from the first line of the HTTP
  request.
* `body` - This might represent the body, but is initially just empty. It's
  up to middlewares to do something with raw body and parse it.
* `rawBody()` - This function uses the [raw-body][5] function to parse the
  body from the request into a string or Buffer. You can only do this once,
  so a middleware should use this function to populate `body`.
* `query` - An object containing the query parametes.
* `type` - The `Content-Type` without additional parameters.
* `accepts` - Uses the [accepts][6] package to do content-negotiation.


### The Response interface

The Response interface represents a HTTP response. It has the following
properties and methods:

* `headers` - An instance of `Headers`.
* `status` - The HTTP status code, for example `200` or `404`.
* `body` - The response body. Can be a string, a buffer or an Object. If it's
  an object, the server will serialize it as JSON.
* `type` - The `Content-Type` without additional parameters.
* `sendInformational(status, headers?)` - Sends a `100 Continue`,
  `102 Processing` or `103 Early Hints` response with optional headers.

### The Headers inteface

The Headers interface represents HTTP headers for both the `Request` and
`Response`.

It has the following methods:

* `set(name, value)` - Sets a HTTP header.
* `get(name)` - Returns the value of a HTTP header, or null.
* `delete(name)` - Deletes a HTTP header.


### Status

* Basic framework is in place.
* Many features still missing.

[1]: https://expressjs.com/ "Express"
[2]: https://koajs.com/ "Koa"
[3]: https://www.typescriptlang.org/ "TypeScript"
[4]: https://tools.ietf.org/html/rfc8297 "RFC8297"
[5]: https://www.npmjs.com/package/raw-body
[6]: https://www.npmjs.com/package/accepts
