# autoTest1

A test automation package for WebSpatial SDK with React integration. This package provides utilities for testing spatial web applications, JSB (JavaScript Bridge) message handling, and spatial element interactions.

## Features

- End-to-end testing with Puppeteer
- JSB (JavaScript Bridge) message handling utilities
- Spatial scene and element testing support
- XR environment simulation
- Automated screenshot capture for debugging

## Installation

```bash
cd /path/to/autoTest1
npm install
```

## Usage

### Running Tests

```bash
npm test
```

### Development Server

To run the development server for testing:

```bash
npm run dev
```

## Key Components

### PuppeteerRunner

A wrapper around Puppeteer for simplified browser automation with spatial web testing capabilities.

### JSBManager

Core handler for JavaScript Bridge messages, providing command registration and message processing.

### PuppeteerPlatform

Platform adapter implementation that integrates with WebSpatial SDK.

## Test Coverage

The package includes tests for:

- React application rendering and interaction
- Spatial element properties (e.g., --xr-back)
- JSB message handling
- Spatial scene and element creation

## Debugging

Test failures automatically capture screenshots for debugging purposes.

## License

MIT