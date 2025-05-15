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
   - It is located in `/builder/visionOSApp/web-spatial.xcodeproj`
   - Click play to launch in the simulator
   - You should now see webspatial running in the simulator
   - To set a custom initial URL, you can modify `web_spatialApp.swift`

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Licenses and Attributions

This project uses the following third-party libraries:

- [@webspatial/core-sdk@0.1.0](https://github.com/webspatial/webspatial-sdk) - Licensed under the ISC
- [loglevel@1.9.2](https://github.com/pimterry/loglevel) - Licensed under the MIT
- [typescript@5.6.3](https://github.com/microsoft/TypeScript) - Licensed under the Apache-2.0
- [@types/hast@3.0.4](https://github.com/DefinitelyTyped/DefinitelyTyped) - Licensed under the MIT
- [@types/lodash.isequal@4.5.8](https://github.com/DefinitelyTyped/DefinitelyTyped) - Licensed under the MIT
- [@types/lodash@4.17.13](https://github.com/DefinitelyTyped/DefinitelyTyped) - Licensed under the MIT
- [@types/react-dom@18.3.1](https://github.com/DefinitelyTyped/DefinitelyTyped) - Licensed under the MIT
- [@types/react@18.3.12](https://github.com/DefinitelyTyped/DefinitelyTyped) - Licensed under the MIT
- [@types/three@0.170.0](https://github.com/DefinitelyTyped/DefinitelyTyped) - Licensed under the MIT
- [@types/unist@3.0.3](https://github.com/DefinitelyTyped/DefinitelyTyped) - Licensed under the MIT
- [@webspatial/react-sdk@0.1.0](https://github.com/webspatial/webspatial-sdk) - Licensed under the ISC
- [lodash.isequal@4.5.0](https://github.com/lodash/lodash) - Licensed under the MIT
- [react-dom@18.3.1](https://github.com/facebook/react) - Licensed under the MIT
- [react@18.3.1](https://github.com/facebook/react) - Licensed under the MIT
- [three@0.170.0](https://github.com/mrdoob/three.js) - Licensed under the MIT
- [typedoc-plugin-markdown@4.2.10](https://github.com/typedoc2md/typedoc-plugin-markdown) - Licensed under the MIT
- [typedoc@0.26.11](https://github.com/TypeStrong/TypeDoc) - Licensed under the Apache-2.0
- [@types/node@22.9.1](https://github.com/DefinitelyTyped/DefinitelyTyped) - Licensed under the MIT
- [@reduxjs/toolkit@2.3.0](https://github.com/reduxjs/redux-toolkit) - Licensed under the MIT
- [@tailwindcss/typography@0.5.15](https://github.com/tailwindlabs/tailwindcss-typography) - Licensed under the MIT
- [@types/animejs@3.1.12](https://github.com/DefinitelyTyped/DefinitelyTyped) - Licensed under the MIT
- [@types/react-syntax-highlighter@15.5.13](https://github.com/DefinitelyTyped/DefinitelyTyped) - Licensed under the MIT
- [@types/redux-state-sync@3.1.10](https://github.com/DefinitelyTyped/DefinitelyTyped) - Licensed under the MIT
- [@types/redux@3.6.0](https://github.com/reactjs/redux) - Licensed under the MIT
- [@types/three@0.164.1](https://github.com/DefinitelyTyped/DefinitelyTyped) - Licensed under the MIT
- [@typescript-eslint/eslint-plugin@7.18.0](https://github.com/typescript-eslint/typescript-eslint) - Licensed under the MIT
- [@typescript-eslint/parser@7.18.0](https://github.com/typescript-eslint/typescript-eslint) - Licensed under the BSD-2-Clause
- [@vitejs/plugin-react@4.3.3](https://github.com/vitejs/vite-plugin-react) - Licensed under the MIT
- [animejs@3.2.2](https://github.com/juliangarnier/anime) - Licensed under the MIT
- [autoprefixer@10.4.20](https://github.com/postcss/autoprefixer) - Licensed under the MIT
- [concurrently@8.2.2](https://github.com/open-cli-tools/concurrently) - Licensed under the MIT
- [daisyui@4.12.14](https://github.com/saadeghi/daisyui) - Licensed under the MIT
- [esbuild-css-modules-plugin@3.1.2](https://github.com/indooorsman/esbuild-css-modules-plugin) - Licensed under the MIT
- [esbuild-plugin-tailwindcss@1.2.1](https://github.com/ttempaa/esbuild-plugin-tailwindcss) - Licensed under the MIT
- [esbuild-sass-plugin@3.3.1](https://github.com/glromeo/esbuild-sass-plugin) - Licensed under the MIT
- [esbuild@0.23.1](https://github.com/evanw/esbuild) - Licensed under the MIT
- [eslint-plugin-react-hooks@4.6.2](https://github.com/facebook/react) - Licensed under the MIT
- [eslint-plugin-react-refresh@0.4.14](https://github.com/ArnaudBarre/eslint-plugin-react-refresh) - Licensed under the MIT
- [eslint@8.57.1](https://github.com/eslint/eslint) - Licensed under the MIT
- [http-server@14.1.1](https://github.com/http-party/http-server) - Licensed under the MIT
- [livereload@0.9.3](https://github.com/napcs/node-livereload) - Licensed under the MIT
- [postcss-modules@6.0.1](https://github.com/css-modules/postcss-modules) - Licensed under the MIT
- [postcss@8.4.49](https://github.com/postcss/postcss) - Licensed under the MIT
- [react-fps@1.0.6](git+https://JohannesKlauss@github.com/JohannesKlauss/react-fps) - Licensed under the MIT
- [react-markdown@9.0.1](https://github.com/remarkjs/react-markdown) - Licensed under the MIT
- [react-redux@9.1.2](https://github.com/reduxjs/react-redux) - Licensed under the MIT
- [react-router-dom@6.28.0](https://github.com/remix-run/react-router) - Licensed under the MIT
- [react-syntax-highlighter@15.6.1](https://github.com/react-syntax-highlighter/react-syntax-highlighter) - Licensed under the MIT
- [redux-state-sync@3.1.4](https://github.com/AOHUA/redux-state-sync) - Licensed under the ISC
- [redux@5.0.1](https://github.com/reduxjs/redux) - Licensed under the MIT
- [styled-components@6.1.13](https://github.com/styled-components/styled-components) - Licensed under the MIT
- [tailwindcss@3.4.15](https://github.com/tailwindlabs/tailwindcss) - Licensed under the MIT
- [three@0.164.1](https://github.com/mrdoob/three.js) - Licensed under the MIT
- [tiny-glob@0.2.9](https://github.com/terkelg/tiny-glob) - Licensed under the MIT
- [web-content@0.0.0](No repository link) - Licensed under the UNLICENSED
- [@eslint-community/eslint-utils@4.4.1](https://github.com/eslint-community/eslint-utils) - Licensed under the MIT
- [@eslint-community/regexpp@4.12.1](https://github.com/eslint-community/regexpp) - Licensed under the MIT
- [@eslint/eslintrc@2.1.4](https://github.com/eslint/eslintrc) - Licensed under the MIT
- [@eslint/js@8.57.1](https://github.com/eslint/eslint) - Licensed under the MIT
- [@typescript-eslint/scope-manager@7.18.0](https://github.com/typescript-eslint/typescript-eslint) - Licensed under the MIT
- [@typescript-eslint/type-utils@7.18.0](https://github.com/typescript-eslint/typescript-eslint) - Licensed under the MIT
- [@typescript-eslint/types@7.18.0](https://github.com/typescript-eslint/typescript-eslint) - Licensed under the MIT
- [@typescript-eslint/typescript-estree@7.18.0](https://github.com/typescript-eslint/typescript-eslint) - Licensed under the BSD-2-Clause
- [@typescript-eslint/utils@7.18.0](https://github.com/typescript-eslint/typescript-eslint) - Licensed under the MIT
- [@typescript-eslint/visitor-keys@7.18.0](https://github.com/typescript-eslint/typescript-eslint) - Licensed under the MIT
- [eslint-scope@7.2.2](https://github.com/eslint/eslint-scope) - Licensed under the BSD-2-Clause
- [eslint-visitor-keys@3.4.3](https://github.com/eslint/eslint-visitor-keys) - Licensed under the Apache-2.0
- [lint-staged@15.2.10](https://github.com/lint-staged/lint-staged) - Licensed under the MIT
- [prettier@3.3.3](https://github.com/prettier/prettier) - Licensed under the MIT
- [simple-git-hooks@2.11.1](https://github.com/toplenboren/simple-git-hooks) - Licensed under the MIT
