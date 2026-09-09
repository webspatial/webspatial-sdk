const test = require('node:test')
const assert = require('node:assert/strict')

const {
  createPicoLaunchCommand,
  createPicoManifest,
  loadPicoManifest,
  normalizePicoBase,
  runPico,
} = require('../dist/lib/cmds/runPico')

function createManifestDependencies({ existingPaths = [] } = {}) {
  const diskLoads = []
  const existsChecks = []
  const networkLoads = []
  return {
    diskLoads,
    existsChecks,
    networkLoads,
    dependencies: {
      existsSync: path => {
        existsChecks.push(path)
        return existingPaths.includes(path)
      },
      loadJsonFromDisk: async path => {
        diskLoads.push(path)
        return { source: 'disk' }
      },
      loadJsonFromNet: async url => {
        networkLoads.push(url)
        return { source: 'network' }
      },
    },
  }
}

test('normalizePicoBase: normalizes a base URL with a trailing slash', () => {
  assert.equal(
    normalizePicoBase('http://10.0.2.2:5173/app'),
    'http://10.0.2.2:5173/app/',
  )
  assert.throws(
    () => normalizePicoBase('http://10.0.2.2:5173/?debug=true'),
    /cannot contain query parameters/,
  )
})

test('createPicoManifest: points the app and its icons at the base URL', () => {
  const manifest = createPicoManifest(
    {
      name: 'PICO Test',
      start_url: '/old',
      scope: '/old',
      icons: [{ src: '/icons/app.png', sizes: '192x192' }],
    },
    'http://10.0.2.2:5173/',
  )

  assert.deepEqual(manifest, {
    name: 'PICO Test',
    start_url: 'http://10.0.2.2:5173/',
    scope: 'http://10.0.2.2:5173/',
    icons: [
      {
        src: 'http://10.0.2.2:5173/icons/app.png',
        sizes: '192x192',
      },
    ],
  })
})

test('loadPicoManifest: loads --manifest-url from the network', async () => {
  const fixture = createManifestDependencies()

  const manifest = await loadPicoManifest(
    { manifestUrl: 'https://example.com/app.webmanifest' },
    fixture.dependencies,
  )

  assert.deepEqual(manifest, { source: 'network' })
  assert.deepEqual(fixture.networkLoads, [
    'https://example.com/app.webmanifest',
  ])
  assert.deepEqual(fixture.diskLoads, [])
})

test('loadPicoManifest: resolves --manifest from the current directory', async () => {
  const fixture = createManifestDependencies()

  const manifest = await loadPicoManifest(
    { manifest: 'config/manifest.json' },
    fixture.dependencies,
  )

  assert.deepEqual(manifest, { source: 'disk' })
  assert.deepEqual(fixture.diskLoads, [`${process.cwd()}/config/manifest.json`])
  assert.deepEqual(fixture.networkLoads, [])
})

test('loadPicoManifest: checks default manifest names in order', async () => {
  const manifestJson = `${process.cwd()}/public/manifest.json`
  const manifestWebmanifest = `${process.cwd()}/public/manifest.webmanifest`
  const fixture = createManifestDependencies({
    existingPaths: [manifestWebmanifest],
  })

  await loadPicoManifest({}, fixture.dependencies)

  assert.deepEqual(fixture.existsChecks, [manifestJson, manifestWebmanifest])
  assert.deepEqual(fixture.diskLoads, [manifestWebmanifest])
})

test('loadPicoManifest: uses the run default when no manifest exists', async () => {
  const fixture = createManifestDependencies()

  const manifest = await loadPicoManifest({}, fixture.dependencies)

  assert.deepEqual(manifest, {
    name: 'WebSpatialTest',
    display: 'minimal-ui',
    start_url: '/',
    scope: '/',
  })
  assert.deepEqual(fixture.diskLoads, [])
})

test('loadPicoManifest: rejects conflicting manifest options', async () => {
  const fixture = createManifestDependencies()

  await assert.rejects(
    loadPicoManifest(
      {
        manifest: 'manifest.json',
        manifestUrl: 'https://example.com/manifest',
      },
      fixture.dependencies,
    ),
    /cannot be used at the same time/,
  )
})

test('createPicoLaunchCommand: safely quotes manifest JSON for adb shell', () => {
  const command = createPicoLaunchCommand({ name: "Developer's App" })

  assert.match(command, /^am start -n com\.picoxr\.browser\//)
  assert.match(command, /--es extra_manifest_json/)
  assert.match(command, /Developer'"'"'s App/)
  assert.match(command, /--es extra_install_type TEMPORARY$/)
})

test('runPico: downloads the manifest and launches it on the default device', async () => {
  let manifestUrl
  let adbCommand

  await runPico(
    {
      base: 'https://example.com/spatial',
      manifestUrl: 'https://example.com/app.webmanifest',
    },
    {
      loadManifest: async args => {
        manifestUrl = args.manifestUrl
        return { name: 'Test', icons: [{ src: '/icon.png' }] }
      },
      executeAdbShell: async command => {
        adbCommand = command
      },
    },
  )

  assert.equal(manifestUrl, 'https://example.com/app.webmanifest')
  assert.match(adbCommand, /https:\/\/example\.com\/spatial\/icon\.png/)
  assert.doesNotMatch(adbCommand, /adb -s/)
})
