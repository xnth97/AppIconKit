import fs from 'fs';
import path from 'path';
import jimp from 'jimp';

type IconPlatform = 'ios' | 'iphone' | 'ipad' | 'watchos' | 'watch' | 'macos' | 'mac';
type IconType = 'icon' | 'image';

interface IconGeneratorOptions {
  type: IconType;
  platform: IconPlatform;
  width?: number;
  height?: number;
}

/**
 * Generator class for iconset/imageset.
 */
class IconGenerator {

  constructor() {

  }

  /**
   * Generates .appiconset with a given image. Image must be larger than 1024x1024.
   * @param inputPath     path of input image
   * @param outputPath    path of output app icon
   * @param platform      platform of app icon (ios | watchos | macos)
   */
  async generateIconSet(inputPath: string, outputPath: string, platform?: IconPlatform): Promise<void> {
    return this.generateImages(inputPath, outputPath, {
      type: 'icon',
      platform: platform ?? 'ios',
    });
  }

  /**
   * Generates .imageset with a given image. 
   * Parameters width and height are for generated @1x image. If both weight and 
   * height are given, the image will be resized to exactly weight and height. If
   * one of width and height is given, it will automatically choose the other
   * dimension for the resized images. If none of them is given, the original image
   * is used as @3x.
   * @param inputPath     path of input image
   * @param outputPath    path of output image set
   * @param width         @1x width of the output image
   * @param height        @1x height of the output image
   */
  async generateImageSet(inputPath: string, outputPath: string, width?: number, height?: number): Promise<void> {
    return this.generateImages(inputPath, outputPath, {
      type: 'icon',
      platform: 'ios',
      width: width ?? jimp.AUTO,
      height: height ?? jimp.AUTO,
    });
  }

  /**
   * Generates .appiconset or .imageset with a given image.
   * @param inputPath         path of input image
   * @param outputPath        path of output images
   * @param generatorOptions  options for image generator
   */
  async generateImages(inputPath: string, outputPath: string, generatorOptions?: IconGeneratorOptions): Promise<void> {
    let options = generatorOptions ?? {
      type: 'icon',
      platform: 'ios',
    };

    const type = options.type;
    let platform = options.platform;
    let programWidth = options.width ?? jimp.AUTO;
    let programHeight = options.height ?? jimp.AUTO;

    const platformMap = {
      'ios': 'ios',
      'iphone': 'ios',
      'ipad': 'ios',
      'watchos': 'watchos',
      'watch': 'watchos',
      'macos': 'macos',
      'mac': 'macos',
    };
    const pathDir = type === 'icon' ? platformMap[platform] : 'imageset';
    const config: { [key: string]: any } = require(`../config/${pathDir}/Contents.json`);

    if (!config) {
      return Promise.reject(new Error('Config file does not exist.'));
    }

    const image = await jimp.read(inputPath);
    if (!image) {
      return Promise.reject(new Error('Invalid input image.'));
    }
    if (type === 'icon' && (image.getWidth() < 1024 || image.getHeight() < 1024)) {
      return Promise.reject(new Error('Icon size must be greater than 1024x1024'));
    }

    let output: string;
    if (type === 'icon') {
      output = path.join(outputPath, 'AppIcon.appiconset');
    } else {
      const fileName = path.basename(inputPath).split('.')[0];
      output = path.join(outputPath, `${fileName}.imageset`);
    }

    try {
      fs.mkdirSync(output);
    } catch(error) {
      return Promise.reject(error);
    }

    let contents = config;
    for (let imageConfig of contents.images) {
      let width: number;
      let height: number;
      const scale = Number(imageConfig.scale.slice(0, -1));
      let fileNameSuffix: string;
      if (type === 'icon') {
        const sizes = imageConfig.size.split('x');
        width = Number(sizes[0]) * scale; 
        height = Number(sizes[1]) * scale;
        fileNameSuffix = `-${width}`;
      } else {
        if (programHeight === jimp.AUTO && programWidth === jimp.AUTO) {
          programWidth = image.bitmap.width / 3;
        }
        width = (programWidth === jimp.AUTO) ? jimp.AUTO : programWidth * scale;
        height = (programHeight === jimp.AUTO) ? jimp.AUTO : programHeight * scale;
        fileNameSuffix = `@${scale}x`;
      }

      const baseName = path.basename(inputPath).split('.')[0];
      const extName = path.extname(inputPath);
      const newFileName = `${baseName}${fileNameSuffix}${extName}`;
      const newPath = path.join(output, newFileName);
      await image.clone().resize(width, height).writeAsync(newPath);

      imageConfig['filename'] = newFileName;
    }

    fs.writeFileSync(path.join(output, 'Contents.json'), JSON.stringify(contents, null, 4));
  }

}

export {
  IconPlatform,
  IconType,
  IconGenerator,
  IconGeneratorOptions,
}