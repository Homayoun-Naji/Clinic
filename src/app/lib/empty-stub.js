// Empty stub used to satisfy Turbopack's client bundle when the server-only
// `@/app/lib/mongodb` module is referenced through the lazily-imported path in
// `api.js`. This module is never executed in the browser — only inside server
// route handlers — so an empty module is safe for the client build.
const emptyStub = {};

export default emptyStub;
