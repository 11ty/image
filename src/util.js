import path from "node:path";
import { decodeHTMLAttribute } from "entities";

export default class Util {
  static KEYS = {
    requested: "requested"
  };

  /*
   * Does not mutate, returns new Object.
   */
  static getSortedObject(unordered) {
    let keys = Object.keys(unordered).sort();
    let obj = {};
    for(let key of keys) {
      obj[key] = unordered[key];
    }
    return obj;
  }

  // Temporary alias for changes made in https://github.com/11ty/image/pull/138
  static isFullUrl(url) {
    return this.isRemoteUrl(url);
  }

  static isRemoteUrl(url) {
    try {
      const validUrl = new URL(url);

      if (validUrl.protocol.startsWith("https:") || validUrl.protocol.startsWith("http:")) {
        return true;
      }

      return false;
    // eslint-disable-next-line no-unused-vars
    } catch(e) {
      // invalid url OR local path
      return false;
    }
  }

  static isDataUri(src) {
    return typeof src === "string" && /^data:/i.test(src);
  }

  // Decodes the payload of a `data:` URI into a Buffer (#70)
  static getDataUriBuffer(src) {
    let commaIndex = src.indexOf(",");
    if(commaIndex === -1) {
      throw new Error(`Invalid data URI (missing comma): ${src.slice(0, 50)}…`);
    }

    let mediaType = src.slice("data:".length, commaIndex).toLowerCase();
    let payload = src.slice(commaIndex + 1);
    if(mediaType.split(";").includes("base64")) {
      return Buffer.from(payload, "base64");
    }

    return Buffer.from(decodeURIComponent(payload));
  }

  static normalizeImageSource({ input, inputPath }, src, options = {}) {
    let { isViaHtml } = Object.assign({
      isViaHtml: false
    }, options);

    if(Util.isFullUrl(src)) {
      return src;
    }

    if(Util.isDataUri(src)) {
      // Decode HTML entities only, percent-encoding is part of the data URI payload
      return isViaHtml ? decodeHTMLAttribute(src) : src;
    }

    if(isViaHtml) {
      // This reference came from HTML, so decode HTML entities in the attribute
      // value (e.g. `rose&amp;rose.jpg` => `rose&rose.jpg`) before resolving the
      // path, mirroring how a browser reads the attribute. See #307.
      src = decodeHTMLAttribute(src);
      src = decodeURIComponent(src);
    }

    if(!path.isAbsolute(src)) {
      // if the image src is relative, make it relative to the template file (inputPath);
      let dir = path.dirname(inputPath);
      return path.join(dir, src);
    }

    // if the image src is absolute, make it relative to the input/content directory.
    return path.join(input, src);
  }

  static isRequested(generatedVia) {
    return generatedVia === this.KEYS.requested;
  }

  static addConfig($config, options) {
    if(!$config) {
      return;
    }

    Object.defineProperty(options, "eleventyConfig", {
      value: $config,
      enumerable: false,
    });
  }
}
