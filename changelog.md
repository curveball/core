0.3.1 (2018-??-??)
=================

* Added License


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
