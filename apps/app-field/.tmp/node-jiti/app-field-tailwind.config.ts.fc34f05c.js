"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
var _tailwindpreset = require('@tower-guard/config/tailwind-preset'); var _tailwindpreset2 = _interopRequireDefault(_tailwindpreset);

const config = {
  presets: [_tailwindpreset2.default ],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
};

exports. default = config;
 /* v7-cea3cb46049855b3 */