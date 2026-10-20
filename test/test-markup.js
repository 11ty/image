import test from "node:test";
import assert from "node:assert/strict";
import eleventyImage from "../img.js";
import { generateHTML, generateObject } from "../src/generate-html.js";

test("Image markup (defaults)", async () => {
  let results = await eleventyImage("./test/bio-2017.jpg", {
    dryRun: true
  });

  assert.equal(generateHTML(results, {
    alt: ""
  }), `<picture><source type="image/webp" srcset="/img/KkPMmHd3hP-1280.webp"><img src="/img/KkPMmHd3hP-1280.jpeg" alt="" width="1280" height="853"></picture>`);
});

test("Image file with diacritics #253", async () => {
  let results = await eleventyImage("./test/les sous titres automatisés de youtube.jpg", {
    dryRun: true
  });

  assert.equal(generateHTML(results, {
    alt: ""
  }), `<picture><source type="image/webp" srcset="/img/KkPMmHd3hP-1280.webp"><img src="/img/KkPMmHd3hP-1280.jpeg" alt="" width="1280" height="853"></picture>`);
});

test("Image service", async () => {
  let serviceApiDomain = "https://zachleat.com";
  let siteUrl = "https://heydonworks.com/";
  let screenshotUrl = `${serviceApiDomain}/api/screenshot/?url=${encodeURIComponent(siteUrl)}&js=false`;

  let options = {
    formats: ["jpeg"],
    widths: [600], // 260-440 in layout
    statsOnly: true,
    imageMetadataOverride: { width: 1440, height: 900 },
    urlFormat: function({ width, format }) {
      return `${serviceApiDomain}/api/image/?url=${encodeURIComponent(screenshotUrl)}&width=${width}&format=${format}`;
    },
  };

  let results = await eleventyImage(screenshotUrl, options);

  assert.equal(generateHTML(results, {
    alt: "",
  }), `<img alt="" src="https://zachleat.com/api/image/?url=https%3A%2F%2Fzachleat.com%2Fapi%2Fscreenshot%2F%3Furl%3Dhttps%253A%252F%252Fheydonworks.com%252F%26js%3Dfalse&width=600&format=jpeg" width="600" height="375">`);
});

test("Image object (defaults)", async () => {
  let results = await eleventyImage("./test/bio-2017.jpg", {
    dryRun: true
  });

  assert.deepEqual(generateObject(results, {
    alt: ""
  }), {
    "picture": {
      "@children": [
        {
          "source": {
            type: "image/webp",
            srcset: "/img/KkPMmHd3hP-1280.webp",
          }
        },
        {
          "img": {
            alt: "",
            src: "/img/KkPMmHd3hP-1280.jpeg",
            width: 1280,
            height: 853,
          }
        }
      ]
    }
  });
});

test("Image markup (two widths)", async () => {
  let results = await eleventyImage("./test/bio-2017.jpg", {
    dryRun: true,
    widths: [200,400]
  });

  assert.equal(generateHTML(results, {
    alt: "",
    sizes: "100vw",
  }), [`<picture>`,
    `<source type="image/webp" srcset="/img/KkPMmHd3hP-200.webp 200w, /img/KkPMmHd3hP-400.webp 400w" sizes="100vw">`,
    `<img src="/img/KkPMmHd3hP-200.jpeg" alt="" width="400" height="266" srcset="/img/KkPMmHd3hP-200.jpeg 200w, /img/KkPMmHd3hP-400.jpeg 400w" sizes="100vw">`,
    `</picture>`].join(""));
});

test("Image markup (two widths, no sizes—throws an error)", async () => {
  let results = await eleventyImage("./test/bio-2017.jpg", {
    dryRun: true,
    widths: [200, 400]
  });

  assert.throws(() => generateHTML(results, {
    alt: "",
  }));
});

test("Image markup (two formats)", async () => {
  let results = await eleventyImage("./test/bio-2017.jpg", {
    dryRun: true,
    formats: ["avif", "webp"],
  });

  assert.equal(generateHTML(results, {
    alt: ""
  }), `<picture><source type="image/avif" srcset="/img/KkPMmHd3hP-1280.avif"><img src="/img/KkPMmHd3hP-1280.webp" alt="" width="1280" height="853"></picture>`);
});

test("Image markup (one format)", async () => {
  let results = await eleventyImage("./test/bio-2017.jpg", {
    dryRun: true,
    formats: [null],
  });

  assert.equal(generateHTML(results, {
    alt: "",
    sizes: "100vw"
  }), `<img src="/img/KkPMmHd3hP-1280.jpeg" alt="" width="1280" height="853">`);
});

test("Image markup (auto format)", async () => {
  let results = await eleventyImage("./test/bio-2017.jpg", {
    dryRun: true,
    formats: ["auto"],
  });

  assert.equal(generateHTML(results, {
    alt: "",
    sizes: "100vw"
  }), `<img src="/img/KkPMmHd3hP-1280.jpeg" alt="" width="1280" height="853">`);
});

test("Image markup (one format, two widths)", async () => {
  let results = await eleventyImage("./test/bio-2017.jpg", {
    dryRun: true,
    formats: [null],
    widths: [100,200],
  });

  assert.equal(generateHTML(results, {
    alt: "",
    sizes: "100vw"
  }), `<img src="/img/KkPMmHd3hP-100.jpeg" alt="" width="200" height="133" srcset="/img/KkPMmHd3hP-100.jpeg 100w, /img/KkPMmHd3hP-200.jpeg 200w" sizes="100vw">`);
});

test("Image markup (throws on invalid object)", async () => {
  assert.throws(() => generateHTML({}, { alt: "" }));
  assert.throws(() => generateHTML({ jpeg: [] }, { alt: "" }));
  assert.throws(() => generateHTML({ webp: [], avif: [] }, { alt: "" }));
  assert.doesNotThrow(() => generateHTML({ jpeg: [{}] }, { alt: "" }));
});

test("Image markup (throws on missing alt)", async () => {
  let results = await eleventyImage("./test/bio-2017.jpg", {
    dryRun: true
  });

  assert.throws(() => generateHTML(results, {
    src: "./test/bio-2017.jpg"
  }), {
    message: "Missing `alt` attribute on `@11ty/eleventy-img` image optimization from: ./test/bio-2017.jpg"
  });
});

test("Image markup (throws on missing alt return html)", async () => {
  await assert.rejects(() => eleventyImage("./test/bio-2017.jpg", {
    dryRun: true,
    returnType: "html"
  }), {
    message: "Missing `alt` attribute on `@11ty/eleventy-img` image optimization from: ./test/bio-2017.jpg"
  });
});

test("Image markup (throws on missing sizes return html)", async () => {
  await assert.rejects(() => eleventyImage("./test/bio-2017.jpg", {
    dryRun: true,
    widths: [100,200],
    returnType: "html",
    htmlOptions: {
      imgAttributes: {
        alt: "",
      }
    }
  }), {
    message: 'Missing `sizes` attribute on image optimization from: ./test/bio-2017.jpg. Workarounds: 1. Use a single output width for this image 2. Use `loading="lazy"` which will add `sizes="auto"` (browser support may vary)'
  });
});

test("#207 Uses sizes=auto as fallback when loading=lazy to avoid error message", async () => {
  let html = await eleventyImage("./test/bio-2017.jpg", {
    dryRun: true,
    widths: [100,200],
    returnType: "html",
    htmlOptions: {
      imgAttributes: {
        alt: "",
        loading: "lazy"
      }
    }
  });

  assert.equal(html, '<picture><source type="image/webp" srcset="/img/KkPMmHd3hP-100.webp 100w, /img/KkPMmHd3hP-200.webp 200w" sizes="auto"><img alt="" loading="lazy" src="/img/KkPMmHd3hP-100.jpeg" width="200" height="133" srcset="/img/KkPMmHd3hP-100.jpeg 100w, /img/KkPMmHd3hP-200.jpeg 200w" sizes="auto"></picture>');
});

test("#298 Single width across multiple formats: no sizes=auto even when loading=lazy (single candidate, no `w` descriptor)", async () => {
  let html = await eleventyImage("./test/bio-2017.jpg", {
    dryRun: true,
    widths: [200],
    returnType: "html",
    htmlOptions: {
      imgAttributes: {
        alt: "",
        loading: "lazy"
      }
    }
  });

  // Single-candidate <source> srcset drops the `w` descriptor, so no `sizes` is added (not even "auto").
  assert.equal(html, '<picture><source type="image/webp" srcset="/img/KkPMmHd3hP-200.webp"><img alt="" loading="lazy" src="/img/KkPMmHd3hP-200.jpeg" width="200" height="133"></picture>');
});

test("#298 Single width across multiple formats drops the `w` descriptor (no sizes needed)", async () => {
  let html = await eleventyImage("./test/bio-2017.jpg", {
    dryRun: true,
    widths: [200],
    formats: ["webp", "jpeg"],
    returnType: "html",
    htmlOptions: {
      imgAttributes: {
        alt: ""
      }
    }
  });

  // A single-candidate srcset needs no `w` descriptor, so no `sizes` is required and none is thrown.
  assert.equal(html, '<picture><source type="image/webp" srcset="/img/KkPMmHd3hP-200.webp"><img alt="" src="/img/KkPMmHd3hP-200.jpeg" width="200" height="133"></picture>');
});

test("Image markup (defaults, inlined)", async () => {
  let results = await eleventyImage("./test/bio-2017.jpg", {
    dryRun: true
  });

  assert.equal(generateHTML(results, {
    alt: ""
  }, {
    whitespaceMode: "block"
  }), `<picture>
  <source type="image/webp" srcset="/img/KkPMmHd3hP-1280.webp">
  <img src="/img/KkPMmHd3hP-1280.jpeg" alt="" width="1280" height="853">
</picture>`);
});

test("svgShortCircuit and generateHTML: Issue #48", async () => {
  // let img = new eleventyImage.Image("./test/Ghostscript_Tiger.svg", {
  //   formats: ["webp", "png", "svg"],
  //   svgShortCircuit: true,
  //   dryRun: true,
  // });
  // let svgStats = eleventyImage.ImageStat.getStat("./test/Ghostscript_Tiger.svg", "svg", "/img/", 900, 900, img.options);
  // console.log( svgStats );

  let stats = await eleventyImage("./test/Ghostscript_Tiger.svg", {
    formats: ["webp", "png", "svg"],
    svgShortCircuit: true,
    dryRun: true,
  });
  assert.equal(stats.svg.length, 1);
  assert.equal(stats.webp, undefined);
  assert.equal(stats.png, undefined);
  assert.equal(stats.svg[0].url, "/img/wGeeKEWkof-900.svg");

  let html = eleventyImage.generateHTML(stats, {
    alt: "Tiger",
  });
  assert.equal(html, `<img src="/img/wGeeKEWkof-900.svg" alt="Tiger" width="900" height="900">`);
});

test("svgShortCircuit (on a raster source) #242 generateHTML function", async () => {
  let stats = await eleventyImage("./test/bio-2017.jpg", {
    widths: ["auto"],
    formats: ["svg", "png"],
    svgShortCircuit: true,
    useCache: false,
    dryRun: true,
  });

  let html = eleventyImage.generateHTML(stats, {
    alt: "Zach’s ugly mug",
  });
  assert.equal(html, `<img src="/img/KkPMmHd3hP-1280.png" alt="Zach’s ugly mug" width="1280" height="853">`);
});

test("Filter out empty format arrays", async () => {
  let stats = {
    svg: [],
    jpeg: [
      {
        format: 'jpeg',
        width: 164,
        height: 164,
        filename: '78c26ccd-164.jpeg',
        outputPath: '_site/v3/img/build/78c26ccd-164.jpeg',
        url: '/v3/img/build/78c26ccd-164.jpeg',
        sourceType: 'image/jpeg',
        srcset: '/v3/img/build/78c26ccd-164.jpeg 164w'
      },
      {
        format: 'jpeg',
        width: 328,
        height: 328,
        filename: '78c26ccd-328.jpeg',
        outputPath: '_site/v3/img/build/78c26ccd-328.jpeg',
        url: '/v3/img/build/78c26ccd-328.jpeg',
        sourceType: 'image/jpeg',
        srcset: '/v3/img/build/78c26ccd-328.jpeg 328w'
      }
    ]
  };

  let html = eleventyImage.generateHTML(stats, {
    alt: "Tiger",
    sizes: "100vw",
  });
  assert.ok(!!html);
});

test("Image markup (animated gif)", async () => {
  let results = await eleventyImage("./test/earth-animated.gif", {
    dryRun: true,
    formats: ["auto"]
  });

  assert.equal(generateHTML(results, {
    alt: ""
  }), `<img src="/img/YQVTYq1wRQ-400.gif" alt="" width="400" height="400">`);
});

test("Image markup (animated gif, two formats)", async () => {
  let results = await eleventyImage("./test/earth-animated.gif", {
    dryRun: true,
    formats: ["webp", "auto"]
  });

  assert.equal(generateHTML(results, {
    alt: ""
  }), `<picture><source type="image/webp" srcset="/img/YQVTYq1wRQ-400.webp"><img src="/img/YQVTYq1wRQ-400.gif" alt="" width="400" height="400"></picture>`);
});

test("Image markup (two formats, neither priority defined)", async () => {
  let results = await eleventyImage("./test/earth-animated.gif", {
    dryRun: true,
    formats: ["tif", "heic"]
  });

  assert.throws(() => generateHTML(results, { alt: "" }), { message: /^Could not find the lowest <img>/ });
});

test("Image markup (escaped `alt`)", async () => {
  let results = await eleventyImage("./test/bio-2017.jpg", {
    formats: ["auto"],
    dryRun: true,
  });

  assert.equal(generateHTML(results, {
    alt: "This is a \"test"
  }), `<img src="/img/KkPMmHd3hP-1280.jpeg" alt="This is a &quot;test" width="1280" height="853">`);
});

test("Image markup (<picture> with attributes issue #197)", async () => {
  let results = await eleventyImage("./test/bio-2017.jpg", {
    formats: ["webp", "auto"],
    dryRun: true,
    widths: [200,400]
  });

  assert.equal(generateHTML(results, {
    alt: "",
    sizes: "100vw",
  }, {
    pictureAttributes: {
      class: "pic"
    }
  }), [`<picture class="pic">`,
    `<source type="image/webp" srcset="/img/KkPMmHd3hP-200.webp 200w, /img/KkPMmHd3hP-400.webp 400w" sizes="100vw">`,
    `<img src="/img/KkPMmHd3hP-200.jpeg" alt="" width="400" height="266" srcset="/img/KkPMmHd3hP-200.jpeg 200w, /img/KkPMmHd3hP-400.jpeg 400w" sizes="100vw">`,
    `</picture>`].join(""));
});

test("Issue #177", async () => {
  let src = "https://www.zachleat.com/img/avatar-2017.png?q=1";

  const options = {
    widths: [700, 1200, 2000],
    formats: ['avif', 'jpeg'],
    outputDir: './_site/img/',
    urlPath: '/img/',
    statsOnly: true,
    imageMetadataOverride: { width: 160, height: 160 },
    cacheOptions: {
      duration: '1d',
    },
  };

  let metadata = await eleventyImage(src, options);

  const imageAttributes = {
    alt: "",
    sizes: '(max-width: 0px) 100vw',
    loading: 'lazy',
    decoding: 'async',
    fetchPriority: 'high',
    class: 'w-full h-full object-cover',
  };

  assert.equal(eleventyImage.generateHTML(metadata, imageAttributes), `<picture><source type="image/avif" srcset="/img/8u6v7oPGyC-160.avif" sizes="(max-width: 0px) 100vw"><img alt="" loading="lazy" decoding="async" fetchPriority="high" class="w-full h-full object-cover" src="/img/8u6v7oPGyC-160.jpeg" width="160" height="160"></picture>`);
});

test("Image markup with smallest fallback dimensions", async () => {
  let results = await eleventyImage("./test/bio-2017.jpg", {
    dryRun: true,
    widths: [300, "auto"],
    formats: ["auto"],
    htmlOptions: {
      fallback: "smallest",
    },
  });

  assert.equal(generateHTML(results, {
    alt: "",
    sizes: "100vw"
  }), `<img src="/img/KkPMmHd3hP-300.jpeg" alt="" width="300" height="199" srcset="/img/KkPMmHd3hP-300.jpeg 300w, /img/KkPMmHd3hP-1280.jpeg 1280w" sizes="100vw">`);
});

test("returnType: html to <img>", async () => {
  let html = await eleventyImage("./test/bio-2017.jpg", {
    dryRun: true,
    formats: ["auto"],
    returnType: "html",

    // passed to generateHTML
    htmlOptions: {
      imgAttributes: {
        alt: "",
      },
    },
  });

  assert.equal(html, `<img alt="" src="/img/KkPMmHd3hP-1280.jpeg" width="1280" height="853">`);
});

test("returnType: html to <picture>", async () => {
  let html = await eleventyImage("./test/bio-2017.jpg", {
    dryRun: true,
    returnType: "html",

    // passed to generateHTML
    htmlOptions: {
      imgAttributes: {
        alt: "",
        class: "inner",
      },
      pictureAttributes: {
        class: "outer"
      }
    },
  });

  assert.equal(html, `<picture class="outer"><source type="image/webp" srcset="/img/KkPMmHd3hP-1280.webp"><img alt="" class="inner" src="/img/KkPMmHd3hP-1280.jpeg" width="1280" height="853"></picture>`);
});

test("#239 full urls in urlPath", async () => {
  let html = await eleventyImage("./test/bio-2017.jpg", {
    dryRun: true,
    formats: ["auto"],
    returnType: "html",
    urlPath: "http://example.com/img/",

    htmlOptions: {
      imgAttributes: {
        alt: "",
      },
    },
  });

  assert.equal(html, `<img alt="" src="http://example.com/img/KkPMmHd3hP-1280.jpeg" width="1280" height="853">`);
});

test("User-supplied htmlOptions attributes are not mutated", async () => {
  let htmlOptions = {
    imgAttributes: { alt: "" },
    pictureAttributes: { class: "pic" },
  };

  let results = await eleventyImage("./test/bio-2017.jpg", {
    dryRun: true,
    widths: [123],
    formats: ["webp", "jpeg"],
    htmlOptions,
  });

  assert.deepEqual(htmlOptions.imgAttributes, { alt: "" });
  assert.deepEqual(htmlOptions.pictureAttributes, { class: "pic" });

  results.eleventyImage.htmlOptions.pictureAttributes.id = "changed";
  assert.deepEqual(htmlOptions.pictureAttributes, { class: "pic" });
});
