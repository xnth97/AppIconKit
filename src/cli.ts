#!/usr/bin/env node
import { Command } from 'commander';
import { IconPlatform, IconType, IconGenerator, IconGeneratorOptions, ImageFormat } from './appiconkit';
import fs from 'fs';
import Jimp from 'jimp';
const pkg = require('../package.json');

const program = new Command();
program
  .version(pkg.version, '-v, --version', 'output the version number')
  .description(pkg.description)
  .arguments('<input>')
  .usage('')
  .option('-o, --output <path>', 'output path for icon set', process.cwd())
  .option('-t, --type <type>', 'type for generated asset', 'icon')
  .option('-p, --platform <value>', 'platform for icon set', 'ios')
  .option('-f, --format <format>', 'format for generated images', 'png')
  .option('-W, --width <number>', 'width for image set', `${Jimp.AUTO}`)
  .option('-H, --height <number>', 'height for image set', `${Jimp.AUTO}`);
  
program.parse(process.argv);

function buildOptions(program: Command): IconGeneratorOptions {
  const options = program.opts();

  let programType: IconType = options.type.toLowerCase();
  const typeSet = new Set<IconType>(['icon', 'image', 'iconset', 'imageset']);
  if (!typeSet.has(programType)) {
    programType = 'icon';
  }

  let programPlatform: IconPlatform = options.platform.toLowerCase();
  const platformSet = new Set<IconPlatform>(['ios', 'iphone', 'ipad', 'watchos', 'watch', 'macos', 'mac', 'web']);
  if (!platformSet.has(programPlatform)) {
    programPlatform = 'ios';
  }

  let programFormat: ImageFormat = options.format.toLowerCase();
  const formatSet = new Set<ImageFormat>(['bmp', 'gif', 'jpeg', 'png', 'tiff', 'default']);
  // For icons, only generate PNG.
  if (!formatSet.has(programFormat) || programType === 'icon') {
    programFormat = 'png';
  }
  // For images, if on Apple platform, we only generate JPEG or PNG.
  if (programType === 'image' && programPlatform !== 'web' && programFormat !== 'jpeg' && programFormat !== 'png') {
    programFormat = 'png';
  }

  return {
    type: programType,
    platform: programPlatform,
    width: Number(options.width),
    height: Number(options.height),
    format: programFormat,
  };
}

if (program.args.length < 1) {
  console.error('Error: must provide an input image');
  process.exit(1);
}

const input = program.args[0];
if (!fs.existsSync(input)) {
  console.error('Error: input image must be valid!');
  process.exit(1);
}

const options = program.opts();

let output: string = options.output;
if (!fs.existsSync(output)) {
  try {
    fs.mkdirSync(output);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

let generator = new IconGenerator();
generator
  .generateImages(input, output, buildOptions(program))
  .catch(e => {
    console.error((e as Error).message);
  });
