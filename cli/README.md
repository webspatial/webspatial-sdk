# **WebSpatial Builder documentation**

# **Introduction**

WebSpatial Builder is a client-side CLI tool used to generate cross platform XRApp projects.
Currently supporting the generation of XRApp for Apple Vision Pro.

# **How to use**
Ensure that you have installed Xcode and Apple Vision Pro simulator.
If you wish to package an IPA file or publish it to App Store Connect, you need to register an Apple developer account in advance and confirm that you have upload permissions.
## **Install**
`pnpm i @webspatial/builder`

## **Usage**
Build and run local WebSpatial project on Apple Vision Pro simulator.

`webspatial-builder run --manifest=public/manifest.json --project=dist --base-url=dist/webspatial/avp --platform=visionos`

- Default parameters
    - --manifest=public/manifest.json
    - --project=dist
    - --platform=visionos
- Necessary parameters
    - --base-url

> The --base-url is the root path to the project. It will be combined with start_url in the manifest.json file to generate the final URL.
>
>**For example:**
>```
>Example 1:
>start_url:./a/index.html
>--base-url:dist/webspatial/avp
>final url:dist/webspatial/avp/a/index.html
>
>Example 2:
>start_url:https://www.domain1.com/a/index.html
>--base-url:https://www.domain2.com/webspatial/avp
>final url:https://www.domain2.com/webspatial/avp/index.html
>
>Example 3:
>start_url:https://www.domain1.com/a/index.html
>--base-url:dist/webspatial/avp
>final url:dist/webspatial/avp/index.html
>```

Package an IPA file.

`webspatial-builder build --manifest=manifest.json --project=dist --base-url=dist/webspatial/avp --platform=visionos --teamId=yourTeamId`

- Necessary parameters
    - --base-url
    - --teamId

      
Publish to App Store Connect.
`webspatial-builder publish --manifest=manifest.json --project=dist --base-url=dist/webspatial/avp --platform=visionos --teamId=yourTeamId --version=projectVersion --u=yourAppleId --p=yourAppSpecificCode`

- Necessary parameters
    - --base-url
    - --teamId
    - --version
    - --u
    - --p