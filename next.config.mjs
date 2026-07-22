/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  turbopack: {
    // `api.js` is imported by both client components (fetch helpers) and server
    // route handlers (Mongoose-backed handlers). The server handlers lazily
    // import `@/app/lib/mongodb`, which pulls the entire Mongoose/mongodb tree
    // (and its Node builtins) into any bundle that references `api.js`. Those
    // handlers only ever run on the server, so for the browser build we alias
    // the project's own DB module to an empty stub. This drops the whole
    // server-only dependency tree from the client bundle in one shot. The
    // server build keeps the real module.
    resolveAlias: {
      "@/app/lib/mongodb": { browser: "./src/app/lib/empty-stub.js" },
    },
  },
};

export default nextConfig;
