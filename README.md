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
* Native support for modern HTTP features, such as [`103 Early Hints`][http-103].
* The ability to easily do internal sub-requests without having to do a real
  HTTP request.

If you used Koa in the past, this is going to look pretty familiar. I'm a big
fan of Koa myself and would recommend it over this project if you don't need
any of the things this project offers.

Installation
------------

    npm install @curveball/core


Getting started
---------------

Curveball only provides a basic framework. Using it means implementing or
using curveball middleware. For example, if you want a router, use or build
a Router middleware.

All of the following examples are written in typescript, but it is also
possible to use the framework with plain javascript.

```typescript
import { Application, Context } from '@curveball/core';

const app = new Application();
app.use((ctx: Context) => {

  ctx.response.status = 200;
  ctx.body = 'Hello world!'

});
```

Middlewares you might want
--------------------------

* [Router](https://github.com/curveballjs/router).
* [Body Parser](https://github.com/curveballjs/bodyparser).


Project status
--------------

The project is currently alpha quality. I would love some feedback on developer
ergonomics. Things might change before a 1.0 release.


Doing internal subrequests
--------------------------

Many Node.js HTTP frameworks don't easily allow doing internal sub-requests.
Instead, they recommend doing a real HTTP request. These requests are more
expensive though, as it has to go through the network stack.

Curveball allows you do do an internal request with 'mock' request and
response objects.

Suggested use-cases:

* Running cheaper integration tests.
* Embedding resources in REST apis.

Example:

```typescript
import { Application } from '@curveball/core';

const app = new Application();
const response = await app.subRequest('POST', '/foo/bar', { 'Content-Type': 'text/html' }, '<h1>Hi</h1>');
```

Only the first 2 arguments are required. It's also possible to pass a Request object instead.

```typescript
import { Application, MemoryRequest } from '@curveball/core';

const app = new Application();
const request = new MemoryRequest('POST', '/foo/bar', { 'Content-Type': 'text/html' }, '<h1>Hi</h1>');
const response = await app.subRequest(request);
```

HTTP/2 push
-----------

HTTP/2 push can be used to anticipate GET requests client might want to do
in the near future.

Example use-cases are:

* Sending scripts and stylesheets earlier for HTML-based sites.
* REST api's sending resources based on relationships clients might want to
  follow.

```typescript
import { Application } from '@curveball/core';
import http2 from 'http2';

const app = new Application();
const server = http2.createSecureSever({
  key: fs.readFileSync('server-key.pem'),
  cert: fs.readFileSync('server-cert.pem')
}, app.callback());

app.use( ctx => {

  ctx.response.status = 200;
  ctx.response.headers.set('Content-Type', 'text/html');
  ctx.response.body = '';

  await ctx.response.push( pushCtx => {

    pushCtx.request.path = '/script.js';
    return app.handle(pushCtx);

  });

});
```

HTTP/2 push works by sending HTTP responses to the client, but it also
includes HTTP requests. This is because HTTP clients need to know which
request the response belongs to.

The `push` function simply takes a middleware, similar to `use` on
Application.  The callback will only be triggered if the clients supports
push and wants to receive pushes.

In the preceding example, we are using `app.handle()` to do a full HTTP
request through all the regular middlewares.

It's not required to do this. You can also generate responses right in the
callback or call an alternative middleware.

Lastly, `pushCtx.request.method` will be set to `GET` by default. `GET` is
also the only supported method for pushes.


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
import { Application, Context, Middleware } from '@curveball/core';

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

### The Application class

The application is main class for your project. It's mainly responsible for
calling middlewares and hooking into the HTTP server.

It has the following methods

* `use(m: Middleware)` - Add a middleware to your application.
* `handle(c: Context)` - Take a Context object, and run all middlewares in
  order on it.
* `listen(port: number)` - Run a HTTP server on the specified port.
* `callback()` - The result of this function can be used as a requestListener
  for node.js `http`, `https` and `http2` packages.
* `subRequest(method: string, path:string, headers: object, body: any)` - Run
  an internal HTTP request and return the result.
* `subRequest(request: Request)` - Run an internal HTTP request and return the
  result.


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
  `102 Processing` or `103 Early Hints` - response with optional headers.
* `push(callback: Middleware)` - Do a HTTP/2 push.


### The Headers inteface

The Headers interface represents HTTP headers for both the `Request` and
`Response`.

It has the following methods:

* `set(name, value)` - Sets a HTTP header.
* `get(name)` - Returns the value of a HTTP header, or null.
* `delete(name)` - Deletes a HTTP header.
* `append(name, value)` - Adds a HTTP header, but doesn't erase an existing
  one with the same name.
* `getAll()` - Returns all HTTP headers as a key-value object.


[1]: https://expressjs.com/ "Express"
[2]: https://koajs.com/ "Koa"
[3]: https://www.typescriptlang.org/ "TypeScript"
[5]: https://www.npmjs.com/package/raw-body
[6]: https://www.npmjs.com/package/accepts
[http-100]: https://tools.ietf.org/html/rfc7231#section-6.2.1 "RFC7231: 100 Continue"
[http-102]: https://tools.ietf.org/html/rfc2518#section-10.1 "RFC2518: 102 Processing"
[http-103]: https://tools.ietf.org/html/rfc8297 "RFC8297: 103 Early Hints"
