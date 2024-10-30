Changelog
=========

1.0.1 (????-??-??)
------------------

* Actually check `CURVEBALL_TRUSTPROXY`.


1.0.0 (2024-01-15)
------------------

* Finally! Curveball v1. Only took 6 years.
* CommonJS support has been dropped. The previous version of this library
  supported both CommonJS and ESM. The effort of this no longer feels worth it.
  ESM is the future, so we're dropping CommonJS.
* Now requires Node 18.


0.21.1 (2023-02-17)
-------------------

* Export server version string


0.21.0 (2023-02-14)
-------------------

* ESM support.
* Dropped Node 14 support. Use Node 16 or later.


0.20.0 (2022-09-03)
-------------------

* Most of the internal plumbing has moved to `@curveball/kernel`.
  `@curveball/core` still contains all of the Node-specific code, but this
  allows curveball to run on Bun.


0.20.0-alpha.0 (2022-09-01)
---------------------------

* Added support for `fetch()`, which lets you make requests in an a Curveball
  application using the native `Request` and `Response` objects.


0.19.0 (2022-04-25)
-------------------

* Now requires Node 14.
* `Application`, `Context`, `Request` and `Response` now have a `origin`
  property. This defaults defaults to `http://localhost`. This can be
  overridden by setting `Application.origin`, or setting a `CURVEBALL_ORIGIN`
  environment variable. `PUBLIC_URI` also works, but it's mainly a fallback for
  earlier examples and recommendations.
* `Request` and `Context` now have a `absoluteUrl` property. This is calculated
  based on the request path and the `origin`.
* BC Break: Due to the new `origin` property, all `Request` and `Response`
  classes now have an extra constructor argument. This means if you ever
  manually constructed any of these, there's a small change you'll need to
  make. Typescript should point all these problems!
* If `CURVEBALL_TRUSTPROXY` is set, `request.ip()` will trust proxies by
  default, and return the ip of the real client instead of the proxy.


0.18.0 (2022-04-16)
-------------------

Identical release as the previous alpha.




0.18.0-alpha.0 (2022-04-09)
---------------------------

* The `Context` interface has been removed, and the `BaseContext` class is
  renamed to `Context`. This is a BC break, but should only be an issue if you
  used the `Context` interface directly. `BaseContext` is still exported but
  simply aliased to `Context`. This alias will be removed from a future
  version. This change should make ite asier to use interface declaration
  merging to extend Context.
* The `ws` dependency has been updated to version 8. There are some [breaking
  changes][ws8] in this release. The most likely you'll hit is that incoming
  messages are now of type `Buffer` instead of `string`. Check out the [ws
  changelog][ws8] for more details.


0.17.0 (2022-02-08)
-------------------

* `listen()` now starts a WebSocket service on the same port by default.
* `listenWs()` is now deprecated, and will be removed in a future version.
* JSON is now pretty-printed by default.

Happy birthday Mom!


0.16.4 (2022-01-05)
-------------------

* Update all dependencies and ensure compatibility with latest Typescript
  changes.


0.16.3 (2021-05-06)
-------------------

* Updated lint rules
* Make file update
* Updated dependencies


0.16.2 (2021-02-18)
-------------------

* Releasing on Github packages.


0.16.1 (2021-02-01)
-------------------

* Request.body is no longer optional, which will help with typing. It can still
  be explicitly set to `null`.


0.16.0 (2021-01-30)
-------------------

* This release is identical to the last


0.16.0-beta.0 (2021-01-10)
--------------------------

* BC Break: `Request.body` is now typed as `unknown` instead of `any`. This
  forces users to either validate the body, or cast to `any`.
* It's now possible to write directly to response streams by setting
  response.body to a callback.


0.15.0 (2020-12-05)
-------------------

* Curveball now required Node 12.
* `esModuleInterop` flag is no longer required to use curveball.


0.14.3 (2020-09-23)
-------------------

* #155 - `listen` and `listenWs` now both have a second `host` argument to bind
  to a specific interface. (@Nicholaiii)
* #145 - `request.headers` and `response.head` function to get a list of header
  values for a given header name. (@Nicholaiii)ers` now have a `getMany()`


0.14.2 (2020-07-14)
-------------------

* Republish of 1.14.1, which was missing some changes.


0.14.1 (2020-07-14)
-------------------

* types ws package is now non-devDependency


0.14.0 (2020-07-13)
-------------------

* Native Websocket support. If enabled, `ctx` will now have a `webSocket`
  property.


0.13.0 (2020-06-16)
-------------------

* Removed `Request` and `Response` interfaces again. They actually made it more
  difficult to extend.


0.12.0 (2020-03-22)
-------------------

* Both `Request` and `Response` are now typescript interfaces. This will allow
  plugins to extends them via interface declaration merging.
* Everything is now compiled with the typescript 'strict' mode, which caused
  some internal refactoring.


0.11.2 (2020-03-09)
-------------------

* Added utilities to check `If-Match`, `If-None-Match`, `If-Modified-Since`,
  `If-Unmodified-Since`.
* Typescript target is now `es2019` instead of `esnext` to ensure that older
  Node.js versions are supported.
* Added a workaround to make sure the package works around a bug in
  `@types/node@13`.


0.11.1 (2020-03-03)
-------------------

* Set `Content-Type` to `text/plain` for errors that fall without being caught
  by an exception handling middleware.


0.11.0 (2020-02-26)
-------------------

* `Context` is no longer a class, it's an interface. It's default
  implementation is now `BaseContext`. This allows plugins to modify the
  interface and add new features.


0.10.0 (2020-01-05)
-------------------

* Added a `redirect()` function to `Context` and `Response` objects, making it
  easier to set a status-code and location header in one step.
* Support for more `Prefer` parameters: `depth-noroot`, `safe`, `transclude`.


0.9.4 (2019-12-21)
------------------

* Fix a bug in HTTP/2 Push. Resources with query parameters in their path were
  not pushed correctly.


0.9.3 (2019-12-19)
------------------

* The `is()` function will now also match wildcards, such as `image/*`.


0.9.2 (2019-11-04)
------------------

* `rawBody()` had an incorrect type. It should _always_ return a `Buffer` if
  the first argument is omitted.


0.9.1 (2019-09-19)
------------------

* The server now sets a `application/hal+json` content-type if nothing else was
  set. This fixes a regression from 0.9.0.


0.9.0 (2019-09-13)
------------------

* `Request` and `Response` types are now abstract classes instead of
  interfaces. This removes a bunch of duplication.
* `Request` objects now have a `prefer()` method for quickly reading out the
  values from the RFC7240 `Prefer` header.


0.8.6 (2019-03-30)
------------------

* Correctly set status for HTTP exceptions in sub-requests.
* Fixed a regression from 0.8.3.


0.8.3 (2019-03-29)
------------------

* Correctly set status for HTTP exceptions in sub-requests.


0.8.2 (2019-03-29)
------------------

* Subrequests should behave as regular requests and catch any exceptions.
* Updated all dependecies.
* Stricter typescript rules.


0.8.1 (2018-11-01)
------------------

* Now exporting an `invokeMiddleware` function that can be used to chain and
  call mutltiple middlewares.
* Application will now by default throw a `NotFound` exception if nothing
  handled a HTTP request.


0.8.0 (2018-10-12)
------------------

* It's now possible to pass objects as Middlewares. If an object has a member
  thats the `middlewareCall` symbol, it will call that instead.
* The package now exports a `invokeMiddleware` function, which is a convenience
  method to call many middlewares.
* #70: It's possible to set `Response.body` to a `stream.Readable` object.
* #91: Bugfix: The `accept()` function ignored changes made my middlewares to
  `Accept` header.


0.7.0 (2018-10-04)
------------------

* The `Context` object now has an `ip` method that can be used to get the ip
  address of the client that's connecting.
* The `Request` and `Response` objects now have an `is()` method that can be
  used to easily check the `Content-Type` header of the object. For example
  `Request.is('json')` will return true for `application/hal+json`.
* The `Headers` object now has a `has()` method.


0.6.0 (2018-09-05)
------------------

* Request and Response object are now generic. `Response<T>` implies the body
  property has type `T`.
* `ctx.status` is now writable.


0.5.0 (2018-08-31)
------------------

* #74: Added `method`, `path`, `status`, `accepts`, `push`,
  `sendInformational`, and `query` to Context object. These properties and
  methods all forward to the request or response object.
* #78: By default the Application will return with a `404` response, unless a
  middleware updates the status or a body was set.
* Tests will now error when a node version under 8.11.2 is used. They broke
  before as well, but it's more explicit now about why.


0.4.3 (2018-07-09)
------------------

* `Application.buildContextFromHttp` is now public.


0.4.2 (2018-07-04)
------------------

* #71: Fixed error messages when a HTTP/2 client disables or refuses a push
  late in the process.
* #72: Refactored node-specific code into its own directory.


0.4.1 (2018-07-01)
------------------

* #57: `Response.type` is now settable.


0.4.0 (2018-07-01)
------------------

* #4: Support for HTTP/2 push via the `Response.push()` method.
* #62: It's now possible to do internal sub-requests without going through the
  HTTP stack, with `Application.subRequest()`.
* Added `MemoryRequest` and `MemoryResponse`.
* #56: `Response.body` may now be `null`.
* Renamed package to `@curveball/core`.


0.3.1 (2018-06-29)
------------------

* Added License, Code of Conduct.
* #52: Support for `Buffer` and arbitrary objects in `response.body`. The
  latter will automatically get converted to JSON.


0.3.0 (2018-06-26)
------------------

* #5: Support for informational status codes such as `100 Continue` and `103
  Early Hints` for both HTTP/1 and HTTP/2.
* #28: HTTP2 support.
* #34: `Application` is now the default export.
* #47: `Application.callback` now returns a callback instead of implementing
  it. This makes it a bit easier to deal with `this` scope and is also
  consistent with Koa.
* #48: Added a setter for `Response.status()`.
* Now exporting the `Middleware` type.


0.2.0 (2018-06-25)
------------------

* #19: Added `Request.rawBody()` method.
* #33: Added `Request.accept()` method.
* #35: Added `Request.type` and `Response.type`.
* #36: Added `Request.query`.
* #37: `Response.body` now has type `any`.
* #38: Added `Context.state`.
* #39: Added `Application.callback`.


0.1.2 (2018-06-24)
------------------

* Set `script` and `types` correctly in `package.json`.


0.1.1 (2018-06-24)
------------------

* Fixed npm package distribution. Was shipping the wrong files.


0.1.0 (2018-06-24)
------------------

* Created `Request`, `Response`, `Application`, `Context`, `Headers` classes.
* Basic framework works


0.0.1 (2018-06-23)
------------------

* First published on npm.js to claim package name.

[ws8]: https://github.com/websockets/ws/releases/tag/8.0.0
