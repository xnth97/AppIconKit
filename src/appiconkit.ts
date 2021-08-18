import fs from 'fs';
import path from 'path';
import Jimp from 'jimp';

type ImageFormat = 'bmp' | 'gif' | 'jpeg' | 'png' | 'tiff' | 'default';
type IconPlatform = 'ios' | 'iphone' | 'ipad' | 'watchos' | 'watch' | 'macos' | 'mac' | 'web';
type GeneratorType = 'icon' | 'image' | 'iconset' | 'imageset';
interface GeneratorOption {
  type: GeneratorType;
  platform: IconPlatform;
  width?: number;
  height?: number;
  format?: ImageFormat;
}

interface ResizeOption {
  width: number;
  height: number;
  filename?: string;
  format?: ImageFormat;
}

/**
 * Generator class for iconset/imageset.
 */
class IconGenerator {

  /**
   * Constructs an IconGenerator object.
   */
  constructor() {
    // no op
  }

  /**
   * Generates .appiconset with a given image. Image must be larger than 1024x1024.
   * @param inputPath     path of input image
   * @param outputPath    path of output app icon
   * @param platform      platform of app icon (ios | watchos | macos)
   */
  async generateIconSet(inputPath: string, outputPath: string, platform?: IconPlatform): Promise<void> {
    return this.generateImageAssets(inputPath, outputPath, {
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
    return this.generateImageAssets(inputPath, outputPath, {
      type: 'icon',
      platform: 'ios',
      width: width ?? Jimp.AUTO,
      height: height ?? Jimp.AUTO,
    });
  }

  /**
   * Generates .appiconset or .imageset or favicon with a given image.
   * @param inputPath         path of input image
   * @param outputPath        path of output images
   * @param generatorOption  options for image generator
   */
  async generateImageAssets(inputPath: string, outputPath: string, generatorOption?: GeneratorOption): Promise<void> {
    let options: GeneratorOption = generatorOption ?? {
      type: 'icon',
      platform: 'ios',
    };

    const type = options.type;
    let platform = options.platform;
    let programWidth = options.width ?? Jimp.AUTO;
    let programHeight = options.height ?? Jimp.AUTO;
    let programFormat = options.format ?? 'png';

    const fileName = path.basename(inputPath).split('.')[0];

    if (options.platform === 'web') {
      let webOutputPath = path.join(outputPath, fileName);
      return this.generateWebIconImages(inputPath, webOutputPath);
    }

    const platformMap = {
      'ios': 'ios',
      'iphone': 'ios',
      'ipad': 'ios',
      'watchos': 'watchos',
      'watch': 'watchos',
      'macos': 'macos',
      'mac': 'macos',
      'web': 'web',
    };
    const pathDir = type === 'icon' ? platformMap[platform] : 'imageset';
    const config: { [key: string]: any } = require(`../config/${pathDir}/Contents.json`);

    if (!config) {
      return Promise.reject(new Error('Error: Config file does not exist.'));
    }

    const image = await Jimp.read(inputPath);
    if (!image) {
      return Promise.reject(new Error('Error: Invalid input image.'));
    }
    if (type === 'icon' && (image.getWidth() < 1024 || image.getHeight() < 1024)) {
      console.warn('Warning: Icon size must be greater than 1024x1024.');
    }

    let output: string;
    if (type === 'icon' || type === 'iconset') {
      output = path.join(outputPath, 'AppIcon.appiconset');
    } else {
      output = path.join(outputPath, `${fileName}.imageset`);
    }

    if (!this.createDirectoryIfNeeded(output)) {
      return Promise.reject(new Error(`Error: cannot create path ${output}.`));
    }

    let contents = config;
    let resizeOptions = new Array<ResizeOption>();

    for (let imageConfig of contents.images) {
      let width: number;
      let height: number;
      const scale = Number(imageConfig.scale.slice(0, -1));
      let fileNameSuffix: string;
      if (type === 'icon' || type === 'iconset') {
        const sizes = imageConfig.size.split('x');
        width = Number(sizes[0]) * scale; 
        height = Number(sizes[1]) * scale;
        fileNameSuffix = `-${width}`;
      } else {
        if (programHeight === Jimp.AUTO && programWidth === Jimp.AUTO) {
          programWidth = image.bitmap.width / 3;
        }
        width = (programWidth === Jimp.AUTO) ? Jimp.AUTO : programWidth * scale;
        height = (programHeight === Jimp.AUTO) ? Jimp.AUTO : programHeight * scale;
        fileNameSuffix = `@${scale}x`;
      }

      const baseName = path.basename(inputPath).split('.')[0];
      let extName = path.extname(inputPath);
      if (programFormat !== 'default') {
        extName = `.${programFormat}`;
      }
      const newFileName = `${baseName}${fileNameSuffix}`;

      let resizeOption: ResizeOption = {
        width: width,
        height: height,
        filename: newFileName,
        format: programFormat,
      };

      imageConfig['filename'] = `${newFileName}${extName}`;
      resizeOptions.push(resizeOption);
    }

    fs.writeFileSync(path.join(output, 'Contents.json'), JSON.stringify(contents, null, 2));
    return this.generateImages(inputPath, output, resizeOptions);
  }

  /**
   * Generate web manifest icon images.
   * @param inputPath    path of input image.
   * @param outputPath   path of output image.
   */
  async generateWebIconImages(inputPath: string, outputPath: string): Promise<void> {
    const config: { [key: string]: Array<number> } = require('../config/web/config.json');
    if (!config) {
      return Promise.reject(new Error('Error: Config file does not exist.'));
    }

    let htmlCode = '';

    let options = new Array<ResizeOption>();
    for (let appleIconDimension of config.appleIconDimensions) {
      options.push({
        width: appleIconDimension,
        height: appleIconDimension,
        filename: `apple-touch-icon-${appleIconDimension}x${appleIconDimension}`,
        format: 'png',
      });
      htmlCode = htmlCode.concat(`<link rel="apple-touch-icon-precomposed" sizes="${appleIconDimension}x${appleIconDimension}" href="apple-touch-icon-${appleIconDimension}x${appleIconDimension}.png" />\n`);
    }
    for (let favIconDimension of config.favIconDimensions) {
      options.push({
        width: favIconDimension,
        height: favIconDimension,
        filename: `favicon-${favIconDimension}x${favIconDimension}`,
        format: 'png',
      });
      htmlCode = htmlCode.concat(`<link rel="icon" type="image/png" href="favicon-${favIconDimension}x${favIconDimension}.png" sizes="${favIconDimension}x${favIconDimension}" />\n`);
    }

    if (!this.createDirectoryIfNeeded(outputPath)) {
      return Promise.reject(new Error(`Error: cannot create directory at output path ${outputPath}.`));
    } 

    let codePath = path.join(outputPath, 'code.txt');
    fs.writeFileSync(codePath, htmlCode);
    console.log(`Generated HTML code for favicons is saved to ${codePath}`);
    return this.generateImages(inputPath, outputPath, options);
  }

  /**
   * Generate resized images with generic options.
   * @param inputPath   path of input image.
   * @param outputPath  path of output image.
   * @param options     generic options for resizing images.
   */
  async generateImages(inputPath: string, outputPath: string, options: Array<ResizeOption>): Promise<void> {
    const image = await Jimp.read(inputPath);
    if (!image) {
      return Promise.reject(new Error('Error: Invalid input image.'));
    }

    if (!this.createDirectoryIfNeeded(outputPath)) {
      return Promise.reject(new Error(`Error: Cannot create directory at output path ${outputPath}.`));
    }

    const extName = path.extname(inputPath);
    for (let option of options) {
      let newFileName: string;
      let newExtName: string;
      if (option.format === 'default') {
        newExtName = extName;
      } else {
        newExtName = `.${option.format ?? 'png'}`;
      }
      if (option.filename !== undefined) {
        newFileName = `${option.filename}${newExtName}`;
      } else {
        newFileName = `Icon-${option.width}${newExtName}`;
      }
      const newPath = path.join(outputPath, newFileName);
      await image.clone().resize(option.width, option.height).writeAsync(newPath);
    }
  }

  private createDirectoryIfNeeded(path: string): boolean {
    if (!fs.existsSync(path)) {
      try {
        fs.mkdirSync(path);
      } catch(error) {
        return false;
      }
    }
    
    if (!fs.lstatSync(path).isDirectory()) {
      return false;
    }

    return true;
  }

}

export {
  GeneratorOption,
  GeneratorType,
  IconGenerator,
  IconPlatform,
  ImageFormat,
  ResizeOption,
}