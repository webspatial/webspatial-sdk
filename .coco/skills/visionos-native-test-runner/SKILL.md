---
name: visionos-native-test-runner
description: |
  Reuses the currently booted visionOS Simulator to run native xcodebuild tests.
  Invoke when running or rerunning visionOS native tests and you want to avoid cold boots or simulator churn.
---

# visionOS Native Test Runner

Use this skill when running native tests for `packages/visionOS` and you want to reuse the currently booted visionOS Simulator instead of triggering unnecessary simulator churn.

## Goal

- Reuse the currently booted visionOS Simulator whenever possible.
- Prefer stable `destination id` targeting over fuzzy device-name targeting.
- Reduce cold boots, clone churn, and repeated test environment setup time.

## When To Invoke

- The user asks to run or rerun native `xcodebuild test` suites for visionOS.
- The user wants tests to reuse the currently active Simulator.
- You are debugging a failing native visionOS test and need fast reruns on the same booted device.

## Required Workflow

1. Check the currently booted Simulator first:

   ```bash
   xcrun simctl list devices booted
   ```

2. If there is a booted visionOS Simulator, extract its UDID and use it in `xcodebuild`:

   ```bash
   xcodebuild test \
     -project packages/visionOS/web-spatial.xcodeproj \
     -scheme web-spatial \
     -destination 'platform=visionOS Simulator,id=<BOOTED_UDID>' \
     -parallel-testing-enabled NO
   ```

3. Prefer targeted reruns with `-only-testing:` when validating a focused fix.

4. Do not proactively shut down, erase, or reboot the Simulator after tests complete.

5. Reuse the same booted device across follow-up reruns unless the user asks to switch devices.

## Guardrails

- Prefer `id=<UDID>` over `name=Apple Vision Pro`.
- Use `-parallel-testing-enabled NO` to improve reuse predictability and reduce extra cloned test runners.
- Reusing the destination id improves reuse odds, but `xcodebuild` may still create a test clone for isolation. Treat this as acceptable platform behavior, not as a reason to shut down the booted Simulator.
- If no visionOS Simulator is currently booted, ask before booting one unless the user already asked you to run the tests immediately.
- If multiple visionOS Simulators are booted, surface the choices and confirm which one to use unless one clearly matches the active project flow.

## Focused Command Patterns

Run one test method:

```bash
xcodebuild test \
  -project packages/visionOS/web-spatial.xcodeproj \
  -scheme web-spatial \
  -destination 'platform=visionOS Simulator,id=<BOOTED_UDID>' \
  -parallel-testing-enabled NO \
  -only-testing:web-spatialTests/SpatializedElementMotionSessionTests/test_playWhileRunningIsNoOp
```

Run one test class:

```bash
xcodebuild test \
  -project packages/visionOS/web-spatial.xcodeproj \
  -scheme web-spatial \
  -destination 'platform=visionOS Simulator,id=<BOOTED_UDID>' \
  -parallel-testing-enabled NO \
  -only-testing:web-spatialTests/SpatializedElementMotionSessionTests
```

## Notes

- This skill is optimized for fast iterative debugging, not for broad CI-style matrix coverage.
- Keep command construction explicit and minimal.
- Favor rerunning the smallest relevant native test slice first, then expand only if needed.