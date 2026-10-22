const test = require('node:test')
const assert = require('node:assert/strict')
const childProcess = require('node:child_process')

const {
  checkPicoPrerequisites,
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
  const steps = []

  await runPico(
    {
      base: 'https://example.com/spatial',
      manifestUrl: 'https://example.com/app.webmanifest',
    },
    {
      checkPrerequisites: async () => {
        steps.push('prerequisites')
      },
      loadManifest: async args => {
        steps.push('manifest')
        manifestUrl = args.manifestUrl
        return { name: 'Test', icons: [{ src: '/icon.png' }] }
      },
      executeAdbShell: async command => {
        steps.push('launch')
        adbCommand = command
      },
    },
  )

  assert.equal(manifestUrl, 'https://example.com/app.webmanifest')
  assert.match(adbCommand, /https:\/\/example\.com\/icon\.png/)
  assert.doesNotMatch(adbCommand, /adb -s/)
  assert.deepEqual(steps, ['prerequisites', 'manifest', 'launch'])
})

test('runPico: stops before loading the manifest when a prerequisite is missing', async () => {
  const steps = []

  await assert.rejects(
    runPico(
      { manifestUrl: 'https://example.com/app.webmanifest' },
      {
        checkPrerequisites: async () => {
          throw new Error('ADB was not found')
        },
        loadManifest: async () => {
          steps.push('manifest')
          return {}
        },
        executeAdbShell: async () => {
          steps.push('launch')
        },
      },
    ),
    /ADB was not found/,
  )

  assert.deepEqual(steps, [])
})

test('runPico: checks ADB before reading a manifest with default dependencies', async t => {
  const commands = []
  t.mock.method(childProcess, 'execFile', (file, args, callback) => {
    assert.equal(file, 'adb')
    commands.push(args)
    callback(
      Object.assign(new Error('spawn adb ENOENT'), { code: 'ENOENT' }),
      '',
      '',
    )
  })

  await assert.rejects(
    runPico({ manifest: 'missing-manifest.json' }),
    /ADB was not found.*Install Android SDK Platform-Tools/,
  )
  assert.deepEqual(commands, [['version']])
})

test('checkPicoPrerequisites: accepts a ready default ADB device', async t => {
  const commands = []
  t.mock.method(childProcess, 'execFile', (file, args, callback) => {
    assert.equal(file, 'adb')
    commands.push(args)
    callback(
      null,
      args[0] === 'version'
        ? 'Android Debug Bridge version 1.0.41\n'
        : 'device\n',
      '',
    )
  })

  await checkPicoPrerequisites()

  assert.deepEqual(commands, [['version'], ['get-state']])
})

const prerequisiteFailures = [
  {
    name: 'missing ADB',
    command: 'version',
    code: 'ENOENT',
    stderr: '',
    message: /Install Android SDK Platform-Tools.*PATH.*adb version/,
  },
  {
    name: 'ADB without execute permission',
    command: 'version',
    code: 'EACCES',
    stderr: '',
    message: /Check the permissions.*PATH.*adb version/,
  },
  {
    name: 'blocked ADB execution',
    command: 'version',
    code: 'EPERM',
    stderr: '',
    message: /Check the permissions.*adb version/,
  },
  {
    name: 'no connected device',
    command: 'get-state',
    code: 1,
    stderr: 'error: no devices/emulators found\n',
    message: /Connect your PICO device.*USB debugging.*adb devices/,
  },
  {
    name: 'missing selected device',
    command: 'get-state',
    code: 1,
    stderr: "error: device 'pico-serial' not found\n",
    message: /No ADB device was found.*ANDROID_SERIAL/,
  },
  {
    name: 'unauthorized device',
    command: 'get-state',
    code: 1,
    stderr: 'error: device unauthorized.\n',
    message: /accept the debugging authorization prompt.*adb devices/,
  },
  {
    name: 'offline device',
    command: 'get-state',
    code: 1,
    stderr: 'error: device offline\n',
    message: /Reconnect your PICO device.*adb kill-server.*adb start-server/,
  },
  {
    name: 'ambiguous device selection',
    command: 'get-state',
    code: 1,
    stderr: 'error: more than one device/emulator\n',
    message: /Disconnect the other devices or set ANDROID_SERIAL.*adb devices/,
  },
  {
    name: 'unexpected ADB failure',
    command: 'get-state',
    code: 1,
    stderr: 'error: cannot connect to daemon\n',
    message: /ADB failed: error: cannot connect to daemon/,
  },
]

for (const failure of prerequisiteFailures) {
  test(`checkPicoPrerequisites: explains ${failure.name}`, async t => {
    const commands = []
    t.mock.method(childProcess, 'execFile', (file, args, callback) => {
      assert.equal(file, 'adb')
      commands.push(args)
      if (args[0] === failure.command) {
        callback(
          Object.assign(new Error('ADB command failed'), {
            code: failure.code,
          }),
          '',
          failure.stderr,
        )
        return
      }
      callback(null, 'Android Debug Bridge version 1.0.41\n', '')
    })

    await assert.rejects(checkPicoPrerequisites(), failure.message)
    assert.deepEqual(
      commands,
      failure.command === 'version'
        ? [['version']]
        : [['version'], ['get-state']],
    )
  })
}

test('checkPicoPrerequisites: rejects an unexpected device state', async t => {
  t.mock.method(childProcess, 'execFile', (_file, args, callback) => {
    callback(
      null,
      args[0] === 'version'
        ? 'Android Debug Bridge version 1.0.41\n'
        : 'unknown\n',
      '',
    )
  })

  await assert.rejects(
    checkPicoPrerequisites(),
    /not ready \(state: unknown\).*adb devices.*"device"/,
  )
})
