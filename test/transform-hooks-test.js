import test from "node:test";
import assert from "node:assert/strict";
import exifr from "exifr";

import eleventyImage from "../img.js";

test("Transform Empty", async () => {
  let stats = await eleventyImage("./test/exif-sample-large.jpg", {
    formats: ["auto"],
    // transform: undefined,
    dryRun: true,
  });

  let exif = await exifr.parse(stats.jpeg[0].buffer);
  assert.deepEqual(exif, undefined);
});

test("Transform to keep exif", async () => {
  let stats = await eleventyImage("./test/exif-sample-large.jpg", {
    formats: ["auto"],
    // Keep exif metadata
    transform: function customNameForCacheKey1(sharp) {
      sharp.keepExif();
    },
    dryRun: true,
  });

  let exif = await exifr.parse(stats.jpeg[0].buffer);

  assert.equal(Math.round(exif.latitude), 50);
  assert.equal(Math.round(exif.longitude), 15);
  assert.equal(exif.ApertureValue, 2);
  assert.equal(exif.BrightnessValue, 9.38);
});

test("Transform to crop an image", async () => {
  let stats = await eleventyImage("./test/exif-sample-large.jpg", {
    formats: ["auto"],
    transform: function customNameForCacheKey2(sharp) {
      sharp.resize(300, 300);
    },
    dryRun: true,
  });

  assert.equal(stats.jpeg[0].width, 300);
  assert.equal(stats.jpeg[0].height, 300);
  assert.equal(stats.jpeg[0].size < 50000, true);
});

test("Resize in a transform an image takes precedence", async () => {
  let stats = await eleventyImage("./test/exif-sample-large.jpg", {
    formats: ["auto"],
    transform: function customNameForCacheKey3(sharp) {
      sharp.resize(400);
    },
    dryRun: true,
  });

  assert.equal(stats.jpeg[0].width, 400);
  assert.equal(stats.jpeg[0].height, 300);
  assert.equal(stats.jpeg[0].size < 50000, true);
});

test("Transform receives target resize stats (narrowed to stable fields) for each width", async () => {
  let received = [];
  await eleventyImage("./test/bio-2017.jpg", {
    widths: [100, 200],
    formats: ["webp"],
    dryRun: true,
    transform: function(sharp, stat) {
      received.push(stat);
    },
  });

  // The target width for each `widths` entry is exposed to the transform
  let widths = received.map(stat => stat.width).sort((a, b) => a - b);
  assert.deepEqual(widths, [100, 200]);

  for(let stat of received) {
    assert.equal(stat.format, "webp");
    assert.equal(typeof stat.height, "number");
    // Only the stable, target-resize fields are exposed (no stale url/srcset/filename)
    assert.deepEqual(Object.keys(stat).sort(), ["format", "height", "width"]);
  }
});

test("manualCacheKey differentiates the output hash for non-object (numeric) values #271", async () => {
  async function filenameFor(manualCacheKey) {
    let stats = await eleventyImage("./test/bio-2017.jpg", {
      widths: [100],
      formats: ["webp"],
      dryRun: true,
      manualCacheKey,
    });
    return stats.webp[0].filename;
  }

  let a = await filenameFor(16 / 7);
  let b = await filenameFor(16 / 8);
  let aAgain = await filenameFor(16 / 7);

  // Different numeric keys must produce different filenames (regression: numbers
  // collapsed to `{}` and every ratio collided).
  assert.notEqual(a, b);
  // Identical keys must produce a stable filename.
  assert.equal(a, aAgain);
});

