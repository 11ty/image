const eleventyImage = require("../");
const Sharp = require("sharp");

const src = "../test/bio-2017.jpg";
const cropRatio = 16 / 7;

async function sanitizeWidths(widths) {
  const {
    width: originalWidth,
    height: originalHeight,
  } = await Sharp(src).metadata();

  const sanitizedWidths = widths.filter(width => {
    const height = Math.floor(width / cropRatio);
    return width <= originalWidth && height <= originalHeight;
  });

  if (sanitizedWidths.length < widths.length) {
    sanitizedWidths.push(getMaxCropWidth(originalWidth, originalHeight));
  }

  return sanitizedWidths;
}

function getMaxCropWidth(originalWidth, originalHeight) {
  const cropWidth = originalWidth;
  const cropHeight = Math.floor(originalWidth / cropRatio);

  if (cropHeight > originalHeight) {
    return getMaxCropWidth(originalWidth - 1, originalHeight);
  }

  return cropWidth;
}

(async () => {

  const widths = await sanitizeWidths([100, 300, 500, 1600, 3200]);

  console.log(widths);

  const results = await eleventyImage(src, {
    widths,
    formats: ["webp"],
    dryRun: true,
    transform: function(sharp, stat) {
      sharp.resize({
        width: stat.width,
        height: Math.floor(stat.width / cropRatio),
        fit: Sharp.fit.cover,
        position: Sharp.strategy.entropy,
      });
    },
    manualCacheKey: cropRatio,
  });

  console.log(results);

})();
