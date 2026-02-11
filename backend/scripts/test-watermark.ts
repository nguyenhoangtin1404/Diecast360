import { ImageProcessorService } from '../src/image-processor/image-processor.service';
import * as sharp from 'sharp';
import * as path from 'path';

async function testWatermark() {
  console.log('Starting watermark test...');

  const processor = new ImageProcessorService();

  // Create a blank orange image for testing
  const width = 800;
  const height = 600;
  const blankImageBuffer = await sharp({
    create: {
      width: width,
      height: height,
      channels: 4,
      background: { r: 255, g: 165, b: 0, alpha: 1 } // Orange
    }
  })
  .png()
  .toBuffer();

  console.log('Created blank test image.');

  try {
    const processedBuffer = await processor.processImage(blankImageBuffer, {
      watermark: true,
      quality: 90
    });

    const outputPath = path.join(__dirname, 'watermark-test-output.jpg');
    await sharp(processedBuffer).toFile(outputPath);

    console.log(`Successfully processed image with watermark.`);
    console.log(`Output saved to: ${outputPath}`);
  } catch (error) {
    console.error('Error processing image:', error);
  }
}

testWatermark();
