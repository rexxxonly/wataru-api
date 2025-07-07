const axios = require("axios");
const tf = require("@tensorflow/tfjs-node");
const Upscaler = require("upscaler").default;
const esrganThick = require("@upscalerjs/esrgan-thick");

const meta = {
  name: "AI Image Upscaler",
  version: "3.0.0",
  description: "Upscale any image from 2x to 6x using AI",
  author: "Rynn",
  method: "post",
  category: "image",
  path: "/upscale"
};

async function onStart({ res, req }) {
  try {
    const { imageUrl, scale = 4 } = req.body;

    // Validate input
    if (!imageUrl) throw new Error("Please provide image URL");
    const scaleFactor = parseInt(scale);
    if (isNaN(scaleFactor)) throw new Error("Scale must be a number (2-6)");
    if (scaleFactor < 2 || scaleFactor > 6) throw new Error("Scale must be between 2 and 6");

    // Download image
    const { data: imageBuffer } = await axios.get(imageUrl, {
      responseType: "arraybuffer"
    });

    // Initialize upscaler
    const upscaler = new Upscaler({
      model: esrganThick,
      scale: scaleFactor
    });

    // AI upscaling
    const upscaledImage = await upscaler.upscale(imageBuffer, {
      output: "base64"
    });

    // Prepare response
    const result = {
      status: "success",
      originalSize: `${(imageBuffer.length / 1024).toFixed(2)} KB`,
      upscaledSize: `${(Buffer.byteLength(upscaledImage, "base64") / 1024).toFixed(2)} KB`,
      scale: `${scaleFactor}x`,
      image: `data:image/png;base64,${upscaledImage}`,
      message: `Image successfully upscaled ${scaleFactor}x`
    };

    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(result, null, 2));

  } catch (error) {
    const errorMessage = {
      error: error.message,
      solution: "Provide a valid image URL and scale (2-6)",
      example: {
        imageUrl: "https://example.com/your-image.jpg",
        scale: 4
      }
    };
    res.statusCode = 400;
    res.end(JSON.stringify(errorMessage, null, 2));
  }
}

module.exports = { meta, onStart };
