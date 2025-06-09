# Contributing to WebSpatial

Thank you for your interest in contributing to WebSpatial! This document provides guidelines and instructions for contributors.

## Prerequisites

### Required Tools

- [NodeJS/NPM](https://nodejs.org/en/download/package-manager) to run local test website
- [XCode >= 15.4](https://apps.apple.com/us/app/xcode/id497799835?mt=12) (If building for VisionOS)
- [VSCode](https://code.visualstudio.com/) Text editor (recommended)

### Recommended Knowledge

Be familiar with web development and common tools like React (how to build UI) and libraries like ThreeJS (3D scene management). Would be good to know how to build a standard website first:

- [ReactJS](https://react.dev/learn)
- [ThreeJS](https://threejs.org/docs/#manual/en/introduction/Installation)
- Ensure you can install npm packages. Try [this](https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally) if npm install fails

Know how to build/run an Apple vision pro app in XCode

- [Hello world](https://developer.apple.com/documentation/visionos/world)

## Development Setup

1. Clone the repository:
```sh
git clone https://github.com/webspatial/webspatial-sdk.git
cd webspatial-sdk
```

2. Install pnpm and setup the project:
```sh
npm install pnpm -g
pnpm setup
```

3. Install packages and link to workspace for local development:
```sh
npm run setup
```

4. Start the development server:
```sh
npm run dev
```

5. Verify that the server is started by going to http://localhost:5173/

## Testing on Apple Vision Pro Simulator

1. Open the project in Xcode:
   - It is located in `/packages/visionOS/web-spatial.xcodeproj`
   - Click play to launch in the simulator
   - You should now see webspatial running in the simulator
   - To set a custom initial URL, you can modify `manifest.swift`

## Packages

- [@webspatial/react-sdk](packages/react/README.md) - The React SDK makes the WebSpatial API immediately available inside React.
- [@webspatial/core-sdk](packages/core/README.md) - The React SDK is implemented on top of the Core SDK, which is a framework-agnostic pure-JS API that enables the WebSpatial App Shell to natively spatialize 2D HTML content and render 3D content.
- [@webspatial/builder](packages/cli/README.md) - The build tool transforms websites into Packaged WebSpatial Apps for debugging and distributing on spatial computing platforms.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Licenses and Attributions

This project uses the following third-party libraries:

- [tsup@8.4.0](https://github.com/egoist/tsup) - Licensed under the MIT
- [typedoc-plugin-markdown@4.6.3](https://github.com/typedoc2md/typedoc-plugin-markdown) - Licensed under the MIT
- [typedoc@0.26.11](https://github.com/TypeStrong/TypeDoc) - Licensed under the Apache-2.0
- [typescript@5.7.3](https://github.com/microsoft/TypeScript) - Licensed under the Apache-2.0
- [@google/model-viewer@4.1.0](https://github.com/google/model-viewer) - Licensed under the Apache-2.0
- [@types/hast@3.0.4](https://github.com/DefinitelyTyped/DefinitelyTyped) - Licensed under the MIT
- [@types/lodash.isequal@4.5.8](https://github.com/DefinitelyTyped/DefinitelyTyped) - Licensed under the MIT
- [@types/lodash@4.17.16](https://github.com/DefinitelyTyped/DefinitelyTyped) - Licensed under the MIT
- [@types/node@22.15.2](https://github.com/DefinitelyTyped/DefinitelyTyped) - Licensed under the MIT
- [@types/react-dom@18.3.7](https://github.com/DefinitelyTyped/DefinitelyTyped) - Licensed under the MIT
- [@types/react@18.3.21](https://github.com/DefinitelyTyped/DefinitelyTyped) - Licensed under the MIT
- [@types/three@0.170.0](https://github.com/DefinitelyTyped/DefinitelyTyped) - Licensed under the MIT
- [@types/unist@3.0.3](https://github.com/DefinitelyTyped/DefinitelyTyped) - Licensed under the MIT
- [esbuild-plugin-d.ts@1.3.1](https://github.com/Floffah/esbuild-plugin-d.ts) - Licensed under the MIT
- [esbuild-plugin-define@0.5.0](https://github.com/webdeveric/esbuild-plugin-define) - Licensed under the MIT
- [esbuild@0.25.3](https://github.com/evanw/esbuild) - Licensed under the MIT
- [lodash.isequal@4.5.0](https://github.com/lodash/lodash) - Licensed under the MIT
- [react-dom@19.1.0](https://github.com/facebook/react) - Licensed under the MIT
- [react@19.1.0](https://github.com/facebook/react) - Licensed under the MIT
- [three@0.170.0](https://github.com/mrdoob/three.js) - Licensed under the MIT
- [tiny-glob@0.2.9](https://github.com/terkelg/tiny-glob) - Licensed under the MIT
- [webpack@5.99.8](https://github.com/webpack/webpack) - Licensed under the MIT
- [@resvg/resvg-js@2.6.2](https://github.com/yisibl/resvg-js) - Licensed under the MPL-2.0
- [@rollup/plugin-terser@0.4.4](https://github.com/rollup/plugins) - Licensed under the MIT
- [@rollup/plugin-typescript@11.1.6](https://github.com/rollup/plugins) - Licensed under the MIT
- [@types/cli-progress@3.11.6](https://github.com/DefinitelyTyped/DefinitelyTyped) - Licensed under the MIT
- [@types/inquirer@8.2.11](https://github.com/DefinitelyTyped/DefinitelyTyped) - Licensed under the MIT
- [@types/mime-types@2.1.4](https://github.com/DefinitelyTyped/DefinitelyTyped) - Licensed under the MIT
- [@types/minimist@1.2.5](https://github.com/DefinitelyTyped/DefinitelyTyped) - Licensed under the MIT
- [@types/node-fetch@2.6.12](https://github.com/DefinitelyTyped/DefinitelyTyped) - Licensed under the MIT
- [@types/node@12.20.55](https://github.com/DefinitelyTyped/DefinitelyTyped) - Licensed under the MIT
- [@types/semver@7.7.0](https://github.com/DefinitelyTyped/DefinitelyTyped) - Licensed under the MIT
- [@types/valid-url@1.0.7](https://github.com/DefinitelyTyped/DefinitelyTyped) - Licensed under the MIT
- [cli-progress@3.12.0](https://github.com/npkgz/cli-progress) - Licensed under the MIT
- [colors@1.4.0](https://github.com/Marak/colors.js) - Licensed under the MIT
- [commander@13.1.0](https://github.com/tj/commander.js) - Licensed under the MIT
- [fetch-h2@2.5.1](https://github.com/grantila/fetch-h2) - Licensed under the MIT
- [fs-extra@11.3.0](https://github.com/jprichardson/node-fs-extra) - Licensed under the MIT
- [glob@10.4.5](https://github.com/isaacs/node-glob) - Licensed under the ISC
- [inquirer@8.2.6](https://github.com/SBoudrias/Inquirer.js) - Licensed under the MIT
- [javascript-obfuscator@4.1.1](https://github.com/javascript-obfuscator/javascript-obfuscator) - Licensed under the BSD-2-Clause
- [jimp@0.22.12](https://github.com/jimp-dev/jimp) - Licensed under the MIT
- [mime-types@2.1.35](https://github.com/jshttp/mime-types) - Licensed under the MIT
- [minimist@1.2.8](https://github.com/minimistjs/minimist) - Licensed under the MIT
- [node-fetch@2.6.7](https://github.com/bitinn/node-fetch) - Licensed under the MIT
- [rollup@3.29.5](https://github.com/rollup/rollup) - Licensed under the MIT
- [semver@7.7.1](https://github.com/npm/node-semver) - Licensed under the ISC
- [sharp@0.33.5](https://github.com/lovell/sharp) - Licensed under the Apache-2.0
- [tslib@2.8.1](https://github.com/Microsoft/tslib) - Licensed under the 0BSD
- [valid-url@1.0.9](https://github.com/ogt/valid-url) - Licensed under the MIT*
- [xcode@3.0.1](https://github.com/apache/cordova-node-xcode) - Licensed under the Apache-2.0
- [@gsap/react@2.1.2](https://github.com/greensock/react) - Licensed under the MIT*
- [@react-spring/web@9.7.5](https://github.com/pmndrs/react-spring) - Licensed under the MIT
- [@reduxjs/toolkit@2.8.0](https://github.com/reduxjs/redux-toolkit) - Licensed under the MIT
- [@tailwindcss/typography@0.5.16](https://github.com/tailwindlabs/tailwindcss-typography) - Licensed under the MIT
- [@tweenjs/tween.js@25.0.0](https://github.com/tweenjs/tween.js) - Licensed under the MIT
- [@types/animejs@3.1.13](https://github.com/DefinitelyTyped/DefinitelyTyped) - Licensed under the MIT
- [@types/react-syntax-highlighter@15.5.13](https://github.com/DefinitelyTyped/DefinitelyTyped) - Licensed under the MIT
- [@types/redux-state-sync@3.1.10](https://github.com/DefinitelyTyped/DefinitelyTyped) - Licensed under the MIT
- [@types/redux@3.6.0](https://github.com/reactjs/redux) - Licensed under the MIT
- [@types/three@0.164.1](https://github.com/DefinitelyTyped/DefinitelyTyped) - Licensed under the MIT
- [@typescript-eslint/eslint-plugin@7.18.0](https://github.com/typescript-eslint/typescript-eslint) - Licensed under the MIT
- [@typescript-eslint/parser@7.18.0](https://github.com/typescript-eslint/typescript-eslint) - Licensed under the BSD-2-Clause
- [@vitejs/plugin-react@4.4.1](https://github.com/vitejs/vite-plugin-react) - Licensed under the MIT
- [@xterm/addon-fit@0.10.0](https://github.com/xtermjs/xterm.js/tree/master/addons/addon-fit) - Licensed under the MIT
- [@xterm/xterm@5.5.0](https://github.com/xtermjs/xterm.js) - Licensed under the MIT
- [animejs@3.2.2](https://github.com/juliangarnier/anime) - Licensed under the MIT
- [autoprefixer@10.4.21](https://github.com/postcss/autoprefixer) - Licensed under the MIT
- [concurrently@8.2.2](https://github.com/open-cli-tools/concurrently) - Licensed under the MIT
- [daisyui@4.12.24](https://github.com/saadeghi/daisyui) - Licensed under the MIT
- [esbuild-css-modules-plugin@3.1.4](https://github.com/indooorsman/esbuild-css-modules-plugin) - Licensed under the MIT
- [esbuild-plugin-tailwindcss@1.2.3](https://github.com/ttempaa/esbuild-plugin-tailwindcss) - Licensed under the MIT
- [esbuild-sass-plugin@3.3.1](https://github.com/glromeo/esbuild-sass-plugin) - Licensed under the MIT
- [eslint-plugin-react-hooks@4.6.2](https://github.com/facebook/react) - Licensed under the MIT
- [eslint-plugin-react-refresh@0.4.20](https://github.com/ArnaudBarre/eslint-plugin-react-refresh) - Licensed under the MIT
- [eslint@8.57.1](https://github.com/eslint/eslint) - Licensed under the MIT
- [gsap@3.13.0](https://github.com/greensock/GSAP) - Licensed under the Custom: https://gsap.com/GSAP-share-image.png
- [http-server@14.1.1](https://github.com/http-party/http-server) - Licensed under the MIT
- [livereload@0.9.3](https://github.com/napcs/node-livereload) - Licensed under the MIT
- [motion@11.18.2](https://github.com/motiondivision/motion) - Licensed under the MIT
- [popmotion@11.0.5](https://github.com/Popmotion/popmotion/tree/master/packages/popmotion) - Licensed under the MIT
- [postcss-modules@6.0.1](https://github.com/css-modules/postcss-modules) - Licensed under the MIT
- [postcss@8.5.3](https://github.com/postcss/postcss) - Licensed under the MIT
- [react-dom@18.3.1](https://github.com/facebook/react) - Licensed under the MIT
- [react-fps@1.0.6](git+https://JohannesKlauss@github.com/JohannesKlauss/react-fps) - Licensed under the MIT
- [react-markdown@9.1.0](https://github.com/remarkjs/react-markdown) - Licensed under the MIT
- [react-redux@9.2.0](https://github.com/reduxjs/react-redux) - Licensed under the MIT
- [react-router-dom@6.30.0](https://github.com/remix-run/react-router) - Licensed under the MIT
- [react-syntax-highlighter@15.6.1](https://github.com/react-syntax-highlighter/react-syntax-highlighter) - Licensed under the MIT
- [react@18.3.1](https://github.com/facebook/react) - Licensed under the MIT
- [redux-state-sync@3.1.4](https://github.com/AOHUA/redux-state-sync) - Licensed under the ISC
- [redux@5.0.1](https://github.com/reduxjs/redux) - Licensed under the MIT
- [styled-components@6.1.17](https://github.com/styled-components/styled-components) - Licensed under the MIT
- [tailwindcss@3.4.17](https://github.com/tailwindlabs/tailwindcss) - Licensed under the MIT
- [three@0.164.1](https://github.com/mrdoob/three.js) - Licensed under the MIT
- [web-content@0.0.5](No repository link) - Licensed under the UNLICENSED
- [@eslint/js@9.26.0](https://github.com/eslint/eslint) - Licensed under the MIT
- [@types/chai@5.2.2](https://github.com/DefinitelyTyped/DefinitelyTyped) - Licensed under the MIT
- [@types/express@5.0.1](https://github.com/DefinitelyTyped/DefinitelyTyped) - Licensed under the MIT
- [@types/mocha@10.0.10](https://github.com/DefinitelyTyped/DefinitelyTyped) - Licensed under the MIT
- [@types/react-dom@19.1.3](https://github.com/DefinitelyTyped/DefinitelyTyped) - Licensed under the MIT
- [@types/react@19.1.3](https://github.com/DefinitelyTyped/DefinitelyTyped) - Licensed under the MIT
- [chai@5.2.0](https://github.com/chaijs/chai) - Licensed under the MIT
- [ci-test@0.0.4](No repository link) - Licensed under the UNLICENSED
- [eslint-plugin-react-hooks@5.2.0](https://github.com/facebook/react) - Licensed under the MIT
- [eslint@9.26.0](https://github.com/eslint/eslint) - Licensed under the MIT
- [express@4.21.2](https://github.com/expressjs/express) - Licensed under the MIT
- [globals@16.1.0](https://github.com/sindresorhus/globals) - Licensed under the MIT
- [mocha@11.2.2](https://github.com/mochajs/mocha) - Licensed under the MIT
- [tsx@4.19.3](https://github.com/privatenumber/tsx) - Licensed under the MIT
- [typescript-eslint@8.32.0](https://github.com/typescript-eslint/typescript-eslint) - Licensed under the MIT
- [vite@6.3.3](https://github.com/vitejs/vite) - Licensed under the MIT
- [@changesets/cli@2.29.2](https://github.com/changesets/changesets/tree/main/packages/cli) - Licensed under the MIT
- [@eslint-community/eslint-utils@4.7.0](https://github.com/eslint-community/eslint-utils) - Licensed under the MIT
- [@eslint-community/regexpp@4.12.1](https://github.com/eslint-community/regexpp) - Licensed under the MIT
- [@eslint/config-array@0.20.0](https://github.com/eslint/rewrite) - Licensed under the Apache-2.0
- [@eslint/config-helpers@0.2.2](https://github.com/eslint/rewrite) - Licensed under the Apache-2.0
- [@eslint/core@0.13.0](https://github.com/eslint/rewrite) - Licensed under the Apache-2.0
- [@eslint/eslintrc@2.1.4](https://github.com/eslint/eslintrc) - Licensed under the MIT
- [@eslint/object-schema@2.1.6](https://github.com/eslint/rewrite) - Licensed under the Apache-2.0
- [@eslint/plugin-kit@0.2.8](https://github.com/eslint/rewrite) - Licensed under the Apache-2.0
- [@types/eslint-scope@3.7.7](https://github.com/DefinitelyTyped/DefinitelyTyped) - Licensed under the MIT
- [@types/eslint@9.6.1](https://github.com/DefinitelyTyped/DefinitelyTyped) - Licensed under the MIT
- [@typescript-eslint/scope-manager@7.18.0](https://github.com/typescript-eslint/typescript-eslint) - Licensed under the MIT
- [@typescript-eslint/type-utils@7.18.0](https://github.com/typescript-eslint/typescript-eslint) - Licensed under the MIT
- [@typescript-eslint/types@7.18.0](https://github.com/typescript-eslint/typescript-eslint) - Licensed under the MIT
- [@typescript-eslint/typescript-estree@7.18.0](https://github.com/typescript-eslint/typescript-eslint) - Licensed under the BSD-2-Clause
- [@typescript-eslint/utils@7.18.0](https://github.com/typescript-eslint/typescript-eslint) - Licensed under the MIT
- [@typescript-eslint/visitor-keys@7.18.0](https://github.com/typescript-eslint/typescript-eslint) - Licensed under the MIT
- [@vitest/coverage-v8@3.1.2](https://github.com/vitest-dev/vitest) - Licensed under the MIT
- [eslint-scope@7.2.2](https://github.com/eslint/eslint-scope) - Licensed under the BSD-2-Clause
- [eslint-visitor-keys@3.4.3](https://github.com/eslint/eslint-visitor-keys) - Licensed under the Apache-2.0
- [lint-staged@15.5.1](https://github.com/lint-staged/lint-staged) - Licensed under the MIT
- [prettier@3.5.3](https://github.com/prettier/prettier) - Licensed under the MIT
- [simple-git-hooks@2.13.0](https://github.com/toplenboren/simple-git-hooks) - Licensed under the MIT
- [vitest@3.1.2](https://github.com/vitest-dev/vitest) - Licensed under the MIT
