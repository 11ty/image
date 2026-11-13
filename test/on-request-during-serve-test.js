import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

import { imageOnRequestDuringServePlugin } from "../img.js";

// The request handler is registered via `setServerOptions`, so grab it instead of booting a dev server.
function getRequestHandler(options = {}) {
  let handler;

  imageOnRequestDuringServePlugin({
    versionCheck() {},
    setServerOptions({ onRequest }) {
      handler = onRequest["/.11ty/image/"];
    },
  }, options);

  return handler;
}

function requestImage(handler, src) {
  let url = new URL("http://localhost/.11ty/image/");
  url.searchParams.set("src", src);
  return handler({ url });
}

// `serve-root-sibling` shares a string prefix with `serve-root` but is not inside it.
async function withProjectDir(callback) {
  let previous = process.cwd();
  process.chdir(fileURLToPath(new URL("./fixtures/serve-root/", import.meta.url)));
  try {
    return await callback();
  } finally {
    process.chdir(previous);
  }
}

test("Dynamic image request rejects a sibling directory that shares a path prefix", async () => {
  let result = await withProjectDir(() => requestImage(getRequestHandler(), "../serve-root-sibling/outside.svg"));

  assert.equal(result.status, 500);
  assert.match(result.headers["x-error-message"], /^Invalid path:/);
});

test("Dynamic image request allows a path inside the working directory", async () => {
  let result = await withProjectDir(() => requestImage(getRequestHandler(), "inside.svg"));

  assert.doesNotMatch(result.headers?.["x-error-message"] || "", /^Invalid path:/);
});
