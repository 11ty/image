import test from "ava";
import Eleventy from "@11ty/eleventy";
import { eleventyImageTransformPlugin } from "../img.js";
import { normalizeEscapedPaths } from "./util/utils.js";

test("Using the transform plugin", async t => {
  let elev = new Eleventy( "test", "test/_site", {
    config: eleventyConfig => {
      eleventyConfig.addTemplate("virtual.html", `<img src="./bio-2017.jpg" alt="My ugly mug">`);

      eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
        dryRun: true // don’t write image files!
      });
    }
  });
  elev.disableLogger();

  let results = await elev.toJSON();
  t.is(results[0].content, `<picture><source type="image/webp" srcset="/virtual/KkPMmHd3hP-1280.webp"><img src="/virtual/KkPMmHd3hP-1280.jpeg" alt="My ugly mug" width="1280" height="853"></picture>`);
});

test("Using the transform plugin, data URI #238", async t => {
  let elev = new Eleventy( "test", "test/_site", {
    config: eleventyConfig => {
      eleventyConfig.addTemplate("virtual.html", `<img src="data:image/" alt="My ugly mug">`);

      eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
        dryRun: true // don’t write image files!
      });
    }
  });

  let results = await elev.toJSON();
  t.is(results[0].content, `<img src="data:image/" alt="My ugly mug">`);
});

test("Using the transform plugin (override options)", async t => {
  let elev = new Eleventy( "test", "test/_site", {
    config: eleventyConfig => {
      eleventyConfig.addTemplate("virtual.html", `<img src="./bio-2017.jpg" alt="My ugly mug">`);

      eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
        formats: ["auto"],
        dryRun: true // don’t write image files!
      });
    }
  });
  elev.disableLogger();

  let results = await elev.toJSON();
  t.is(results[0].content, `<img src="/virtual/KkPMmHd3hP-1280.jpeg" alt="My ugly mug" width="1280" height="853">`);
});

test("Using the transform plugin with transform on request during dev mode", async t => {
  let elev = new Eleventy( "test", "test/_site", {
    config: eleventyConfig => {
      eleventyConfig.addTemplate("virtual.html", `<img src="./bio-2017.jpg" alt="My ugly mug">`);

      eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
        formats: ["auto"],
        transformOnRequest: true,
        dryRun: true, // don’t write image files!

        defaultAttributes: {}
      });
    }
  });
  elev.disableLogger();

  let results = await elev.toJSON();
  t.is(normalizeEscapedPaths(results[0].content), `<img src="/.11ty/image/?src=test%2Fbio-2017.jpg&width=1280&format=jpeg&via=transform" alt="My ugly mug" width="1280" height="853">`);
});

test("Using the transform plugin with transform on request during dev mode (with default attributes)", async t => {
  let elev = new Eleventy( "test", "test/_site", {
    config: eleventyConfig => {
      eleventyConfig.addTemplate("virtual.html", `<img src="./bio-2017.jpg" alt="My ugly mug">`);

      eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
        formats: ["auto"],
        transformOnRequest: true,
        dryRun: true, // don’t write image files!

        defaultAttributes: {
          loading: "lazy",
        }
      });
    }
  });

  let results = await elev.toJSON();
  t.is(normalizeEscapedPaths(results[0].content), `<img src="/.11ty/image/?src=test%2Fbio-2017.jpg&width=1280&format=jpeg&via=transform" alt="My ugly mug" loading="lazy" width="1280" height="853">`);
});


test("Using the transform plugin with transform on request during dev mode but don’t override existing urlFormat", async t => {
  let elev = new Eleventy( "test", "test/_site", {
    config: eleventyConfig => {
      eleventyConfig.addTemplate("virtual.html", `<img src="./bio-2017.jpg" alt="My ugly mug">`);

      eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
        urlFormat: function() {
          return 'https://example.com/';
        },
        formats: ["auto"],
        transformOnRequest: true,
        dryRun: true, // don’t write image files!

        defaultAttributes: {
          loading: "lazy",
        }
      });
    }
  });

  let results = await elev.toJSON();
  t.is(results[0].content, `<img src="https://example.com/" alt="My ugly mug" loading="lazy" width="1280" height="853">`);
});

test("Throw a good error with a bad remote image request", async t => {
  let elev = new Eleventy( "test", "test/_site", {
    config: eleventyConfig => {
      eleventyConfig.addTemplate("virtual.html", `<img src="https://images.opencollective.com/sdkljflksjdflksdjf_DOES_NOT_EXIST/NOT_EXIST/avatar.png" alt="My ugly mug">`);

      eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
        formats: ["auto"],
        // transformOnRequest: true,
        // dryRun: true, // don’t write image files!

        defaultAttributes: {
          loading: "lazy",
        }
      });
    }
  });
  elev.disableLogger();

  let e = await t.throwsAsync(() => elev.toJSON());
  t.is(e.message, `Having trouble writing to "./test/_site/virtual/index.html" from "./test/virtual.html"`);
});

test("Transform image file with diacritics #253", async t => {
  let elev = new Eleventy( "test", "test/_site", {
    config: eleventyConfig => {
      eleventyConfig.addTemplate("virtual.html", `<img src="./les sous titres automatisés de youtube.jpg" alt="My ugly mug">`);

      eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
        formats: ["auto"],
        dryRun: true, // don’t write image files!

        defaultAttributes: {}
      });
    }
  });
  elev.disableLogger();

  let results = await elev.toJSON();
  t.is(normalizeEscapedPaths(results[0].content), `<img src="/virtual/KkPMmHd3hP-1280.jpeg" alt="My ugly mug" width="1280" height="853">`);
});

test("Transform image file in folder with diacritics #253", async t => {
  let elev = new Eleventy( "test", "test/_site", {
    config: eleventyConfig => {
      // Broken:  20240705.île-de-myst-en-lego
      // Working: 20240705.île-de-myst-en-lego
      eleventyConfig.addTemplate("virtual.html", `<img src="./20240705.île-de-myst-en-lego/les sous titres automatisés de youtube.jpg" alt="My ugly mug">`);
      eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
        formats: ["auto"],
        dryRun: true, // don’t write image files!
        defaultAttributes: {}
      });
    }
  });

  elev.disableLogger();

  let results = await elev.toJSON();
  t.is(normalizeEscapedPaths(results[0].content), `<img src="/virtual/KkPMmHd3hP-1280.jpeg" alt="My ugly mug" width="1280" height="853">`);
});

test("Transform image file in markdown with diacritics #253", async t => {
  let elev = new Eleventy( "test", "test/_site", {
    config: eleventyConfig => {
      eleventyConfig.addTemplate("virtual.md", `![My ugly mug](./automatisés.jpg)`);

      eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
        formats: ["auto"],
        dryRun: true, // don’t write image files!
        defaultAttributes: {},
      });
    }
  });
  elev.disableLogger();

  let results = await elev.toJSON();
  t.is(normalizeEscapedPaths(results[0].content).trim(), `<p><img src="/virtual/KkPMmHd3hP-1280.jpeg" alt="My ugly mug" width="1280" height="853"></p>`);
});

// Doesn’t work on Ubuntu
test.skip("Transform image file in folder with *combining* diacritics #253", async t => {
  let elev = new Eleventy( "test", "test/_site", {
    config: eleventyConfig => {
      eleventyConfig.addTemplate("virtual.html", `<img src="./île-de-myst-en-lego/les sous titres automatisés de youtube.jpg" alt="My ugly mug">`);
      eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
        formats: ["auto"],
        dryRun: true, // don’t write image files!
        defaultAttributes: {}
      });
    }
  });

  let results = await elev.toJSON();
  t.is(normalizeEscapedPaths(results[0].content), `<img src="/virtual/KkPMmHd3hP-1280.jpeg" alt="My ugly mug" width="1280" height="853">`);
});

test("Don’t throw an error when failOnError: false with a bad remote image request", async t => {
  let elev = new Eleventy( "test", "test/_site", {
    config: eleventyConfig => {
      eleventyConfig.addTemplate("virtual.html", `<img src="https://images.opencollective.com/sdkljflksjdflksdjf_DOES_NOT_EXIST/NOT_EXIST/avatar.png" alt="My ugly mug">`);

      eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
        formats: ["auto"],
        // transformOnRequest: true,
        // dryRun: true, // don’t write image files!

        failOnError: false,

        defaultAttributes: {
          loading: "lazy",
        }
      });
    }
  });
  elev.disableLogger();

  let results = await elev.toJSON();
  t.is(normalizeEscapedPaths(results[0].content), `<img src="https://images.opencollective.com/sdkljflksjdflksdjf_DOES_NOT_EXIST/NOT_EXIST/avatar.png" alt="My ugly mug">`);
});

test("Don’t throw an error when failOnError: true but `eleventy:optional=keep` attribute with a bad remote image request", async t => {
  let elev = new Eleventy( "test", "test/_site", {
    config: eleventyConfig => {
      eleventyConfig.addTemplate("virtual.html", `<img src="https://images.opencollective.com/sdkljflksjdflksdjf_DOES_NOT_EXIST/NOT_EXIST/avatar.png" alt="My ugly mug" eleventy:optional="keep">`);

      eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
        formats: ["auto"],
        // transformOnRequest: true,
        // dryRun: true, // don’t write image files!

        failOnError: true,

        defaultAttributes: {
          loading: "lazy",
        }
      });
    }
  });
  elev.disableLogger();

  let results = await elev.toJSON();
  t.is(normalizeEscapedPaths(results[0].content), `<img src="https://images.opencollective.com/sdkljflksjdflksdjf_DOES_NOT_EXIST/NOT_EXIST/avatar.png" alt="My ugly mug">`);
});

test("Don’t throw an error when failOnError: false and `eleventy:optional=keep` attribute with a bad remote image request", async t => {
  let elev = new Eleventy( "test", "test/_site", {
    config: eleventyConfig => {
      eleventyConfig.addTemplate("virtual.html", `<img src="https://images.opencollective.com/sdkljflksjdflksdjf_DOES_NOT_EXIST/NOT_EXIST/avatar.png" alt="My ugly mug" eleventy:optional="keep">`);

      eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
        formats: ["auto"],
        // transformOnRequest: true,
        // dryRun: true, // don’t write image files!

        failOnError: false,

        defaultAttributes: {
          loading: "lazy",
        }
      });
    }
  });
  elev.disableLogger();

  let results = await elev.toJSON();
  t.is(normalizeEscapedPaths(results[0].content), `<img src="https://images.opencollective.com/sdkljflksjdflksdjf_DOES_NOT_EXIST/NOT_EXIST/avatar.png" alt="My ugly mug">`);
});

test("Don’t throw an error when failOnError: false and `eleventy:optional` attribute with a bad remote image request", async t => {
  let elev = new Eleventy( "test", "test/_site", {
    config: eleventyConfig => {
      eleventyConfig.addTemplate("virtual.html", `<img src="https://images.opencollective.com/sdkljflksjdflksdjf_DOES_NOT_EXIST/NOT_EXIST/avatar.png" alt="My ugly mug" eleventy:optional>`);

      eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
        formats: ["auto"],

        defaultAttributes: {
          loading: "lazy",
        }
      });
    }
  });
  elev.disableLogger();

  let results = await elev.toJSON();
  t.is(normalizeEscapedPaths(results[0].content), `<img alt="My ugly mug">`);
});

test("Don’t throw an error when failOnError: false and `eleventy:optional=placeholder` attribute with a bad remote image request", async t => {
  let elev = new Eleventy( "test", "test/_site", {
    config: eleventyConfig => {
      eleventyConfig.addTemplate("virtual.html", `<img src="https://images.opencollective.com/sdkljflksjdflksdjf_DOES_NOT_EXIST/NOT_EXIST/avatar.png" alt="My ugly mug" eleventy:optional="placeholder">`);

      eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
        formats: ["auto"],

        defaultAttributes: {
          loading: "lazy",
        }
      });
    }
  });
  elev.disableLogger();

  let results = await elev.toJSON();
  t.is(normalizeEscapedPaths(results[0].content), `<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=" alt="My ugly mug">`);
});

test("Using the transform plugin, <img src=video.mp4> #257", async t => {
  let elev = new Eleventy( "test", "test/_site", {
    config: eleventyConfig => {
      eleventyConfig.addTemplate("virtual.html", `<img src="car.mp4" alt="My ugly mug" eleventy:optional="keep">`);

      eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
        dryRun: true, // don’t write image files!
      });
    }
  });

  let results = await elev.toJSON();
  t.is(results[0].content, `<img src="car.mp4" alt="My ugly mug">`);
});

test("Using the transform plugin, <picture> to <picture> #214", async t => {
  let elev = new Eleventy( "test", "test/_site", {
    config: eleventyConfig => {
      eleventyConfig.addTemplate("virtual.html", `<picture class="outer"><source type="image/webp" srcset="./bio-2017.webp 1280w"><img src="./bio-2017.jpg" alt="My ugly mug" class="inner"></picture>`);

      eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
        dryRun: true, // don’t write image files!
      });
    }
  });
  elev.disableLogger();

  let results = await elev.toJSON();
  t.is(results[0].content, `<picture class="outer"><source type="image/webp" srcset="/virtual/KkPMmHd3hP-1280.webp"><img src="/virtual/KkPMmHd3hP-1280.jpeg" alt="My ugly mug" class="inner" width="1280" height="853"></picture>`);
});

test("Using the transform plugin, <picture> to <img> #214", async t => {
  let elev = new Eleventy( "test", "test/_site", {
    config: eleventyConfig => {
      // Uses only the <img src> right now, see the debatable TODO in transform-plugin.js->getSourcePath
      eleventyConfig.addTemplate("virtual.html", `<picture class="outer"><source type="image/webp" srcset="./bio-2017.webp 1280w"><img src="./bio-2017.jpg" alt="My ugly mug" class="inner"></picture>`);

      eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
        formats: ["auto"],
        dryRun: true, // don’t write image files!
      });
    }
  });
  elev.disableLogger();

  let results = await elev.toJSON();
  t.is(results[0].content, `<img src="/virtual/KkPMmHd3hP-1280.jpeg" alt="My ugly mug" class="inner" width="1280" height="853">`);
});

test("Using the transform plugin, <img> to <picture> #214", async t => {
  let elev = new Eleventy( "test", "test/_site", {
    config: eleventyConfig => {
      eleventyConfig.addTemplate("virtual.html", `<img src="./bio-2017.jpg" alt="My ugly mug" class="inner" eleventy:pictureattr:class="outer">`);

      eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
        dryRun: true, // don’t write image files!
      });
    }
  });
  elev.disableLogger();

  let results = await elev.toJSON();
  t.is(results[0].content, `<picture class="outer"><source type="image/webp" srcset="/virtual/KkPMmHd3hP-1280.webp"><img src="/virtual/KkPMmHd3hP-1280.jpeg" alt="My ugly mug" class="inner" width="1280" height="853"></picture>`);
});

test("Using the transform plugin, <img> to <img>, keeps slot attribute #241", async t => {
  let elev = new Eleventy( "test", "test/_site", {
    config: eleventyConfig => {
      eleventyConfig.addTemplate("virtual.html", `<img src="./bio-2017.jpg" alt="My ugly mug" slot="image-1">`);

      eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
        formats: ["auto"],
        dryRun: true, // don’t write image files!
      });
    }
  });
  elev.disableLogger();

  let results = await elev.toJSON();
  t.is(results[0].content, `<img src="/virtual/KkPMmHd3hP-1280.jpeg" alt="My ugly mug" slot="image-1" width="1280" height="853">`);
});

test("Using the transform plugin, <img> to <picture>, keeps slot attribute #241", async t => {
  let elev = new Eleventy( "test", "test/_site", {
    config: eleventyConfig => {
      eleventyConfig.addTemplate("virtual.html", `<img src="./bio-2017.jpg" alt="My ugly mug" slot="image-1">`);

      eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
        dryRun: true, // don’t write image files!
      });
    }
  });
  elev.disableLogger();

  let results = await elev.toJSON();
  t.is(results[0].content, `<picture><source type="image/webp" srcset="/virtual/KkPMmHd3hP-1280.webp"><img src="/virtual/KkPMmHd3hP-1280.jpeg" alt="My ugly mug" slot="image-1" width="1280" height="853"></picture>`);
});

test("#234 Use existing `width` attribute for `widths` config", async t => {
  let elev = new Eleventy( "test", "test/_site", {
    config: eleventyConfig => {
      eleventyConfig.addTemplate("virtual.html", `<img src="./bio-2017.jpg" alt="My ugly mug" width="200">`);

      eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
        dryRun: true, // don’t write image files!
      });
    }
  });
  elev.disableLogger();

  let results = await elev.toJSON();
  t.is(results[0].content, `<picture><source type="image/webp" srcset="/virtual/KkPMmHd3hP-200.webp"><img src="/virtual/KkPMmHd3hP-200.jpeg" alt="My ugly mug" width="200" height="133"></picture>`);
});

test("#234 Use existing `width` attribute for `widths` config (huge width uses max intrinsic)", async t => {
  let elev = new Eleventy( "test", "test/_site", {
    config: eleventyConfig => {
      eleventyConfig.addTemplate("virtual.html", `<img src="./bio-2017.jpg" alt="My ugly mug" width="2000">`);

      eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
        dryRun: true, // don’t write image files!
      });
    }
  });
  elev.disableLogger();

  let results = await elev.toJSON();
  t.is(results[0].content, `<picture><source type="image/webp" srcset="/virtual/KkPMmHd3hP-1280.webp"><img src="/virtual/KkPMmHd3hP-1280.jpeg" alt="My ugly mug" width="1280" height="853"></picture>`);
});

test("#234 Use existing `width` attribute for `widths` config (comma separated widths are ignored as invalid. Discourage invalid `width` HTML attribute, use eleventy:widths instead)", async t => {
  let elev = new Eleventy( "test", "test/_site", {
    config: eleventyConfig => {
      eleventyConfig.addTemplate("virtual.html", `<img src="./bio-2017.jpg" alt="My ugly mug" width="100,200">`);

      eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
        dryRun: true, // don’t write image files!
      });
    }
  });
  elev.disableLogger();

  let results = await elev.toJSON();
  t.is(results[0].content, `<picture><source type="image/webp" srcset="/virtual/KkPMmHd3hP-1280.webp"><img src="/virtual/KkPMmHd3hP-1280.jpeg" alt="My ugly mug" width="1280" height="853"></picture>`);
});

test("#314 Prefer `eleventy:widths` over `width` attribute", async t => {
  let elev = new Eleventy( "test", "test/_site", {
    config: eleventyConfig => {
      eleventyConfig.addTemplate("virtual.html", `<img src="./bio-2017.jpg" alt="My ugly mug" eleventy:widths="100" width="200">`);

      eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
        dryRun: true, // don’t write image files!
      });
    }
  });
  elev.disableLogger();

  let results = await elev.toJSON();
  t.is(results[0].content, `<picture><source type="image/webp" srcset="/virtual/KkPMmHd3hP-100.webp"><img src="/virtual/KkPMmHd3hP-100.jpeg" alt="My ugly mug" width="100" height="66"></picture>`);
});

test("#306 `eleventy:sizes` overrides `sizes` default from config", async t => {
  let elev = new Eleventy( "test", "test/_site", {
    config: eleventyConfig => {
      eleventyConfig.addTemplate("virtual.html", `<img src="./bio-2017.jpg" alt="My ugly mug" eleventy:widths="100,200" eleventy:sizes="(max-width: 599px) 100vw, 600px">`);

      eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
        dryRun: true, // don’t write image files!

        defaultAttributes: {
          sizes: "(max-width: 1024px) 100vw, 1600px",
        }
      });
    }
  });
  elev.disableLogger();

  let results = await elev.toJSON();
  t.is(results[0].content, `<picture><source type="image/webp" srcset="/virtual/KkPMmHd3hP-100.webp 100w, /virtual/KkPMmHd3hP-200.webp 200w" sizes="(max-width: 599px) 100vw, 600px"><img src="/virtual/KkPMmHd3hP-100.jpeg" alt="My ugly mug" width="200" height="133" srcset="/virtual/KkPMmHd3hP-100.jpeg 100w, /virtual/KkPMmHd3hP-200.jpeg 200w" sizes="(max-width: 599px) 100vw, 600px"></picture>`);
});

test("#306 `eleventy:sizes` overrides `sizes` attribute", async t => {
  let elev = new Eleventy( "test", "test/_site", {
    config: eleventyConfig => {
      eleventyConfig.addTemplate("virtual.html", `<img src="./bio-2017.jpg" alt="My ugly mug" eleventy:widths="100,200" sizes="(max-width: 1024px) 100vw, 1600px" eleventy:sizes="(max-width: 599px) 100vw, 600px">`);

      eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
        dryRun: true, // don’t write image files!
      });
    }
  });
  elev.disableLogger();

  let results = await elev.toJSON();
  t.is(results[0].content, `<picture><source type="image/webp" srcset="/virtual/KkPMmHd3hP-100.webp 100w, /virtual/KkPMmHd3hP-200.webp 200w" sizes="(max-width: 599px) 100vw, 600px"><img src="/virtual/KkPMmHd3hP-100.jpeg" alt="My ugly mug" width="200" height="133" srcset="/virtual/KkPMmHd3hP-100.jpeg 100w, /virtual/KkPMmHd3hP-200.jpeg 200w" sizes="(max-width: 599px) 100vw, 600px"></picture>`);
});

test("#306 `sizes` attribute overrides `sizes` default from config", async t => {
  let elev = new Eleventy( "test", "test/_site", {
    config: eleventyConfig => {
      eleventyConfig.addTemplate("virtual.html", `<img src="./bio-2017.jpg" alt="My ugly mug" eleventy:widths="100,200" sizes="(max-width: 599px) 100vw, 600px">`);

      eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
        dryRun: true, // don’t write image files!

        defaultAttributes: {
          sizes: "(max-width: 1024px) 100vw, 1600px",
        }
      });
    }
  });
  elev.disableLogger();

  let results = await elev.toJSON();
  t.is(results[0].content, `<picture><source type="image/webp" srcset="/virtual/KkPMmHd3hP-100.webp 100w, /virtual/KkPMmHd3hP-200.webp 200w" sizes="(max-width: 599px) 100vw, 600px"><img src="/virtual/KkPMmHd3hP-100.jpeg" alt="My ugly mug" width="200" height="133" srcset="/virtual/KkPMmHd3hP-100.jpeg 100w, /virtual/KkPMmHd3hP-200.jpeg 200w" sizes="(max-width: 599px) 100vw, 600px"></picture>`);
});


test("#236 Use with permalink with file name", async t => {
  let elev = new Eleventy( "test", "test/_site", {
    config: eleventyConfig => {
      eleventyConfig.addTemplate("virtual.md", `![alt text](./bio-2017.jpg)`, {
        permalink: "blog/posts/blog-post.html"
      });

      eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
        formats: ["auto"],
        dryRun: true, // don’t write image files!
      });
    }
  });
  elev.disableLogger();

  let results = await elev.toJSON();

  t.is(results[0].content.trim(), `<p><img src="/blog/posts/KkPMmHd3hP-1280.jpeg" alt="alt text" width="1280" height="853"></p>`);
});

test("Using imgAttributes/pictureAttributes alongside defaultAttributes (removing this from docs) in transform method", async t => {
  let elev = new Eleventy( "test", "test/_site", {
    config: eleventyConfig => {
      eleventyConfig.addTemplate("virtual.html", `<img src="./bio-2017.jpg" alt="My ugly mug">`);

      eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
        // formats: ["auto"],
        dryRun: true, // don’t write image files!
        htmlOptions: {
          imgAttributes: {
            class: "inner",
          },
          pictureAttributes: {
            class: "outer",
          }
        },
        defaultAttributes: {
          class: "lol",
        }
      });
    }
  });

  let results = await elev.toJSON();
  t.is(results[0].content, `<picture class="outer"><source type="image/webp" srcset="/virtual/KkPMmHd3hP-1280.webp"><img class="inner" src="/virtual/KkPMmHd3hP-1280.jpeg" alt="My ugly mug" width="1280" height="853"></picture>`);
});

test("#276 Strip eleventy:ignore attribute from img elements inside picture elements", async t => {
  let elev = new Eleventy( "test", "test/_site", {
    config: eleventyConfig => {
      eleventyConfig.addTemplate("virtual.html", `<picture><img eleventy:ignore src="./bio-2017.jpg" alt="My ugly mug"></picture>`);

      eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
        dryRun: true, // don’t write image files!
      });
    }
  });
  elev.disableLogger();

  let results = await elev.toJSON();
  t.is(results[0].content, `<picture><img src="./bio-2017.jpg" alt="My ugly mug"></picture>`);
});

test("#212 Passthrough via `formats: ['passthrough']` plugin option (adds width/height, no Sharp processing)", async t => {
  let elev = new Eleventy( "test", "test/_site", {
    config: eleventyConfig => {
      eleventyConfig.addTemplate("virtual.html", `<img src="./bio-2017.jpg" alt="My ugly mug">`);

      eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
        formats: ["passthrough"], // passthrough: copy original bytes, just add dimensions
        dryRun: true, // don’t write image files!
      });
    }
  });
  elev.disableLogger();

  let results = await elev.toJSON();
  // native format (jpeg), single <img> (no <picture>), intrinsic dimensions
  t.is(results[0].content, `<img src="/virtual/KkPMmHd3hP.jpeg" alt="My ugly mug" width="1280" height="853">`);
});

test("#212 Passthrough via `eleventy:formats=\"passthrough\"` attribute", async t => {
  let elev = new Eleventy( "test", "test/_site", {
    config: eleventyConfig => {
      eleventyConfig.addTemplate("virtual.html", `<img eleventy:formats="passthrough" src="./bio-2017.jpg" alt="My ugly mug">`);

      eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
        dryRun: true, // don’t write image files!
      });
    }
  });
  elev.disableLogger();

  let results = await elev.toJSON();
  t.is(results[0].content, `<img src="/virtual/KkPMmHd3hP.jpeg" alt="My ugly mug" width="1280" height="853">`);
});

test("#212 Passthrough via `eleventy:formats=\"passthrough\"` attribute overrides a processing default", async t => {
  let elev = new Eleventy( "test", "test/_site", {
    config: eleventyConfig => {
      eleventyConfig.addTemplate("virtual.html", `<img eleventy:formats="passthrough" src="./bio-2017.jpg" alt="My ugly mug">`);

      eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
        formats: ["webp", "jpeg"],
        dryRun: true, // don’t write image files!
      });
    }
  });
  elev.disableLogger();

  let results = await elev.toJSON();
  t.is(results[0].content, `<img src="/virtual/KkPMmHd3hP.jpeg" alt="My ugly mug" width="1280" height="853">`);
});

test("#212 Passthrough as one of many formats: <picture> with a webp source and the original <img> fallback", async t => {
  let elev = new Eleventy( "test", "test/_site", {
    config: eleventyConfig => {
      eleventyConfig.addTemplate("virtual.html", `<img src="./bio-2017.jpg" alt="My ugly mug">`);

      eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
        formats: ["webp", "passthrough"],
        dryRun: true, // don’t write image files!
      });
    }
  });
  elev.disableLogger();

  let results = await elev.toJSON();
  t.is(results[0].content, `<picture><source type="image/webp" srcset="/virtual/KkPMmHd3hP-1280.webp"><img src="/virtual/KkPMmHd3hP.jpeg" alt="My ugly mug" width="1280" height="853"></picture>`);
});

test("#212 Passthrough during --serve mode defers to the on-request endpoint (nothing written at transform time)", async t => {
  let elev = new Eleventy( "test", "test/_site", {
    config: eleventyConfig => {
      eleventyConfig.addTemplate("virtual.html", `<img src="./bio-2017.jpg" alt="My ugly mug">`);

      eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
        formats: ["passthrough"],
        transformOnRequest: true,
        dryRun: true,
      });
    }
  });
  elev.disableLogger();

  let results = await elev.toJSON();
  // Nothing is written at transform time: src points at /.11ty/image/ with `format=passthrough`,
  // which tells the on-request endpoint to stream the original bytes (no re-encode) in dev.
  t.is(normalizeEscapedPaths(results[0].content), `<img src="/.11ty/image/?src=test%2Fbio-2017.jpg&width=1280&format=passthrough&via=transform" alt="My ugly mug" width="1280" height="853">`);
});

// https://github.com/11ty/image/issues/358 (originally reported as 11ty/eleventy-base-blog#252)
// When an image can’t be resolved and `failOnError: false`, we used to leave `src` set to the
// file system path we resolved internally (e.g. `content/kittens.jpg`) instead of the author’s
// original attribute value. Remote sources didn’t show this because `normalizeImageSource`
// returns full URLs untouched—only local sources are rewritten.
test("#358 failOnError: false keeps the original `src` for a missing local image (root-relative)", async t => {
  let elev = new Eleventy( "test", "test/_site", {
    config: eleventyConfig => {
      // `/img/logo.webp` is passthrough copied in the user’s project, so it does not exist
      // relative to the input directory.
      eleventyConfig.addTemplate("virtual.html", `<img src="/img/logo.webp" alt="My ugly mug" style="padding: 2em;">`);

      eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
        formats: ["auto"],
        failOnError: false,
        dryRun: true, // don’t write image files!
      });
    }
  });
  elev.disableLogger();

  let results = await elev.toJSON();
  t.is(results[0].content, `<img src="/img/logo.webp" alt="My ugly mug" style="padding: 2em;">`);
});

test("#358 failOnError: false keeps the original `src` for a missing local image (relative)", async t => {
  let elev = new Eleventy( "test", "test/_site", {
    config: eleventyConfig => {
      eleventyConfig.addTemplate("virtual.html", `<img src="./kittens-DOES-NOT-EXIST.jpg" alt="My ugly mug">`);

      eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
        formats: ["auto"],
        failOnError: false,
        dryRun: true, // don’t write image files!
      });
    }
  });
  elev.disableLogger();

  let results = await elev.toJSON();
  t.is(results[0].content, `<img src="./kittens-DOES-NOT-EXIST.jpg" alt="My ugly mug">`);
});

// Both fixtures below mirror eleventy-base-blog’s `content/`: a post whose image sits next to it,
// rendered inline on the home page as well as on the post’s own page. They are ignored by the other
// tests in this file via `test/.eleventyignore`.

// Variant A — relative `src` + `renderTransforms(post.data.page)`:
//   index.njk          {{ post.content | renderTransforms(post.data.page) | safe }}
//   blog/post.md       <img src="./bio-2017.jpg">
//   blog/bio-2017.jpg  colocated alongside post.md
// `renderTransforms` runs the transform with the *post’s* page entry, so the relative `src` resolves
// against `blog/post.md` and the home page gets the same colocated URL as the post’s own page.
// The page-level transform then runs a second time over that already-resolved URL: it can’t find
// `/blog/post/RMWe6Me2nc-150.jpeg` on disk, so it must leave the value alone. Before the fix it
// overwrote it with the file system path it tried, which is why `renderTransforms` appeared to do
// nothing at all.
test("#358 `renderTransforms(post.data.page)` resolves a relative `src` in inline-rendered post content", async t => {
  let elev = new Eleventy( "test/fixtures/issue358-relative", "test/_site", {
    config: eleventyConfig => {
      eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
        formats: ["auto"],
        failOnError: false,
        dryRun: true, // don’t write image files!
      });
    }
  });
  elev.disableLogger();

  let results = await elev.toJSON();
  let home = results.filter(entry => entry.url === "/")[0];
  let post = results.filter(entry => entry.url === "/blog/post/")[0];

  let expected = `<img src="/blog/post/RMWe6Me2nc-150.jpeg" alt="My ugly mug" width="150" height="100">`;
  t.is(post.content.trim(), expected);
  // The whole point of #358: inline rendering resolves to the same image as the post’s own page.
  t.is(home.content.trim(), expected);
});

// Variant B — absolute `src`, no `renderTransforms`:
//   index.njk          {{ post.content | safe }}
//   blog/post.md       <img src="/blog/bio-2017.jpg">   (relative to the *input* directory)
//   blog/bio-2017.jpg  colocated alongside post.md
// An absolute `src` never depends on the rendering page: `normalizeImageSource` joins it to the
// input directory rather than to `inputPath`, and `getOutputLocations` sends it to the shared
// `/img/` output instead of colocating it. So inline rendering resolves with no filter at all—and,
// unlike variant A, this one already worked before the fix.
test("#358 an absolute `src` resolves in inline-rendered post content without `renderTransforms`", async t => {
  let elev = new Eleventy( "test/fixtures/issue358-absolute", "test/_site", {
    config: eleventyConfig => {
      eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
        formats: ["auto"],
        failOnError: false,
        dryRun: true, // don’t write image files!
      });
    }
  });
  elev.disableLogger();

  let results = await elev.toJSON();
  let home = results.filter(entry => entry.url === "/")[0];
  let post = results.filter(entry => entry.url === "/blog/post/")[0];

  let expected = `<img src="/img/RMWe6Me2nc-150.jpeg" alt="My ugly mug" width="150" height="100">`;
  t.is(post.content.trim(), expected);
  t.is(home.content.trim(), expected);
});

test("#357 Relative image on a page with `.html` stripped from its url via addUrlTransform", async t => {
  let elev = new Eleventy( "test", "test/_site", {
    config: eleventyConfig => {
      eleventyConfig.addTemplate("virtual.md", `![alt text](./bio-2017.jpg)`, {
        permalink: "items/hiw-10.html"
      });

      eleventyConfig.addUrlTransform(({ url }) => url.replace(/\.html$/, ""));

      eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
        formats: ["auto"],
        dryRun: true, // don’t write image files!
      });
    }
  });
  elev.disableLogger();

  let results = await elev.toJSON();

  t.is(results[0].url, "/items/hiw-10");
  t.is(results[0].content.trim(), `<p><img src="/items/KkPMmHd3hP-1280.jpeg" alt="alt text" width="1280" height="853"></p>`);
});
