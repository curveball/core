0.6.0 (2018-09-05)
==================

* Request and Response object are now generic. `Response<T>` implies the body
  property has type `T`.
* `ctx.status` is now writable.


0.5.0 (2018-08-31)
==================

* #74: Added `method`, `path`, `status`, `accepts`, `push`, `sendInformational`,
  and `query` to Context object. These properties and methods all forward to
  the request or response object.
* #78: By default the Application will return with a `404` response, unless a
  middleware updates the status or a body was set.
* Tests will now error when a node version under 8.11.2 is used. They broke
  before as well, but it's more explicit now about why.


0.4.3 (2018-07-09)
==================

* `Application.buildContextFromHttp` is now public.


0.4.2 (2018-07-04)
==================

* #71: Fixed error messages when a HTTP/2 client disables or refuses a push
  late in the process.
* #72: Refactored node-specific code into its own directory.


0.4.1 (2018-07-01)
==================

* #57: `Response.type` is now settable.


0.4.0 (2018-07-01)
==================

* #4: Support for HTTP/2 push via the `Response.push()` method.
* #62: It's now possible to do internal sub-requests without going through
  the HTTP stack, with `Application.subRequest()`.
* Added `MemoryRequest` and `MemoryResponse`.
* #56: `Response.body` may now be `null`.
* Renamed package to `@curveball/core`.


0.3.1 (2018-06-29)
=================

* Added License, Code of Conduct.
* #52: Support for `Buffer` and arbitrary objects in `response.body`. The
  latter will automatically get converted to JSON.


0.3.0 (2018-06-26)
==================

* #5: Support for informational status codes such as `100 Continue` and
  `103 Early Hints` for both HTTP/1 and HTTP/2.
* #28: HTTP2 support.
* #34: `Application` is now the default export.
* #47: `Application.callback` now returns a callback instead of implementing
  it. This makes it a bit easier to deal with `this` scope and is also
  consistent with Koa.
* #48: Added a setter for `Response.status()`.
* Now exporting the `Middleware` type.


0.2.0 (2018-06-25)
==================

* #19: Added `Request.rawBody()` method.
* #33: Added `Request.accept()` method.
* #35: Added `Request.type` and `Response.type`.
* #36: Added `Request.query`.
* #37: `Response.body` now has type `any`.
* #38: Added `Context.state`.
* #39: Added `Application.callback`.


0.1.2 (2018-06-24)
==================

* Set `script` and `types` correctly in `package.json`.


0.1.1 (2018-06-24)
==================

* Fixed npm package distribution. Was shipping the wrong files.


0.1.0 (2018-06-24)
==================

* Created `Request`, `Response`, `Application`, `Context`, `Headers` classes.
* Basic framework works


0.0.1 (2018-06-23)
==================

* First published on npm.js to claim package name.
