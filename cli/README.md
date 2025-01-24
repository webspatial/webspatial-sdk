## picoxr-web
Client CLI tool to Generate TWA projects from a Web Manifest or a local Manifest json file
## Requirements
- [Node.js](https://nodejs.org/en/) 14.15.0 or above
## Setting up the Environment
When running picoxr-web for the first time, it will offer to automatically download and install
external dependencies.
## Installation
Using npm:
```shell
npm i -g @picoxr/web-cli
```
## Usage
### Bundle the Manifest file to a Android Application
```shell
picoxr-web build --manifest-url=https://my-twa.com/manifest.json
```
or
```shell
picoxr-web build --manifest=/path/to/local/manifest.json
```
This command gets the Manifest file from the website or locally, and generates the Android application to the current directory.Make sure your user has write permissions to the current directory.Note that the start_url in the local file must be an accessible http website.
## Commands
The diagram above shows which commands we offered to help generate Android Application.
## `build`
Usage:
```
picoxr-web build --manifest-url="<manifest-url>"
```
or 
```
picoxr-web build --manifest="<local-manifest-path>"
```
Params:
- --manifest-url: manifest url
- --manifest: local manifest path
## `check`
Usage:
```
picoxr-web check --url="<url>"
```
Params:
- --url: url to check
## Support
Tested in  Node.js 14-16.