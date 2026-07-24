const test = require("ava");
const exifr = require("exifr");

const eleventyImage = require("../img.js");

test("Transform Empty", async t => {
  let stats = await eleventyImage("./test/exif-sample-large.jpg", {
    formats: ["auto"],
    // transform: undefined,
    dryRun: true,
  });

  let exif = await exifr.parse(stats.jpeg[0].buffer);
  t.deepEqual(exif, undefined);
});

test("Transform to keep exif", async t => {
  let stats = await eleventyImage("./test/exif-sample-large.jpg", {
    formats: ["auto"],
    // Keep exif metadata
    transform: function customNameForCacheKey1(sharp) {
      sharp.keepExif();
    },
    dryRun: true,
  });

  let exif = await exifr.parse(stats.jpeg[0].buffer);

  t.is(Math.round(exif.latitude), 50);
  t.is(Math.round(exif.longitude), 15);
  t.is(exif.ApertureValue, 2);
  t.is(exif.BrightnessValue, 9.38);
});

test("Transform to crop an image", async t => {
  let stats = await eleventyImage("./test/exif-sample-large.jpg", {
    formats: ["auto"],
    transform: function customNameForCacheKey2(sharp) {
      sharp.resize(300, 300);
    },
    dryRun: true,
  });

  t.is(stats.jpeg[0].width, 300);
  t.is(stats.jpeg[0].height, 300);
  t.true(stats.jpeg[0].size < 50000);
});

test("Resize in a transform an image takes precedence", async t => {
  let stats = await eleventyImage("./test/exif-sample-large.jpg", {
    formats: ["auto"],
    transform: function customNameForCacheKey3(sharp) {
      sharp.resize(400);
    },
    dryRun: true,
  });

  t.is(stats.jpeg[0].width, 400);
  t.is(stats.jpeg[0].height, 300);
  t.true(stats.jpeg[0].size < 50000);
});

test("Transform receives target resize stats (narrowed to stable fields) for each width", async t => {
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
  t.deepEqual(widths, [100, 200]);

  for(let stat of received) {
    t.is(stat.format, "webp");
    t.is(typeof stat.height, "number");
    // Only the stable, target-resize fields are exposed (no stale url/srcset/filename)
    t.deepEqual(Object.keys(stat).sort(), ["format", "height", "width"]);
  }
});

test("manualCacheKey differentiates the output hash for non-object (numeric) values #271", async t => {
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
  t.not(a, b);
  // Identical keys must produce a stable filename.
  t.is(a, aAgain);
});

