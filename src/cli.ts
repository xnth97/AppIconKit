#!/usr/bin/env node
import program from 'commander';
import { IconPlatform, IconType, IconGenerator, IconGeneratorOptions } from './appiconkit';
import fs from 'fs';
import jimp from 'jimp';
const pkg = require('../package.json');

program
  .version(pkg.version, '-v, --version', 'output the version number')
  .description(pkg.description)
  .arguments('<input>')
  .usage('')
  .option('-o, --output <path>', 'output path for icon set', process.cwd())
  .option('-t, --type <type>', 'type for generated asset', 'icon')
  .option('-p, --platform <value>', 'platform for icon set', 'ios')
  .option('-W, --width <number>', 'width for image set', jimp.AUTO)
  .option('-H, --height <number>', 'height for image set', jimp.AUTO);
  
program.parse(process.argv);

function buildOptions(program: any): IconGeneratorOptions {
  let programType: IconType = program.type.toLowerCase();
  const typeSet = new Set<IconType>(['icon', 'image']);
  if (!typeSet.has(programType)) {
    programType = 'icon';
  }

  let programPlatform: IconPlatform = program.platform.toLowerCase();
  const platformSet = new Set<IconPlatform>(['ios', 'iphone', 'ipad', 'watchos', 'watch', 'macos', 'mac']);
  if (!platformSet.has(programPlatform)) {
    programPlatform = 'ios';
  }

  return {
    type: programType,
    platform: programPlatform,
    width: Number(program.width),
    height: Number(program.height),
  };
}

if (program.args.length < 1) {
  console.error('Error: must provide an input image');
  process.exit(0);
}

const input = program.args[0];
if (!fs.existsSync(input)) {
  console.error('Error: input image must be valid!');
  process.exit(0);
}

let output: string = program.output;
if (!fs.existsSync(output)) {
  try {
    fs.mkdirSync(output);
  } catch (err) {
    console.error(err.message);
    process.exit(0);
  }
}

let generator = new IconGenerator();
generator
  .generateImages(input, output, buildOptions(program))
  .catch(e => {
    console.error((e as Error).message);
  });
