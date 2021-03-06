# AppIconKit

An app icon/image assets generator for apps.

[![badge](https://img.shields.io/npm/v/appiconkit.svg?color=blue)](https://www.npmjs.com/package/appiconkit)

## CLI

### Installation

Install the package globally.

```
npm install -g appiconkit
```

The default command is `icon`.

```
icon <input> [options]
```

### Options

`-o, --output <path>`: Output path for generated icon set or image set. Default value is current path.

`-t, --type <type>`: Type for generated assets. Can be `icon | image`.

`-p, --platform <platform>`: Platform for icon set. Can be `ios | watchos | macos | web`.

Please note that for `web` platform, only manifest icon images will be generated, following definitions [here](https://web.dev/add-manifest/).

`-f, --format <format>`: Format for generated images. Can be `'bmp' | 'gif' | 'jpeg' | 'png' | 'tiff' | 'default'`. Default value is `png`.

Please note that `default` value means that keeps the original format. For `icon` type, this option will be ignored and only PNG will be generated. On Apple platforms, only JPEG and PNG will be generated.

`-W, --width <number>`: @1x width for generated image set.

`-H, --height <number>`: @1x height for generated image set.

Please note that width and height are for generated @1x image. If both weight and height are given, the image will be resized to exactly weight and height. If one of width and height is given, it will automatically choose the other dimension for the resized images. If none of them is given, the original image is used as @3x.

`-h, --help`: Shows the help.

## Usage

Install the package under your project.

```
npm install --save appiconkit
```

Import the dependency in your code.

```javascript
const { IconGenerator } = require('appiconkit');
```

Initialize an `IconGenerator` instance.

```javascript
let g = new IconGenerator();
```

Call proper functions to generate imageset or appiconset.

```javascript
g.generateIconSet('/path/to/image', '/path/to/output');
```

Or you can call `generateImages` and pass your own options.

```javascript
g.generateImages('/path/to/image', '/path/to/output', {
  type: 'image',
  platform: 'ios',
  width: 160,
  height: 120,
  format: 'png',
});
```

## License

The project is released under MIT license. Please see [LICENSE](LICENSE) for full terms.