@testable import WebSpatial
import XCTest

/// Shared observation point for `JSBThreadProbeCommand`, which records where and
/// when `JSBManager` decodes an incoming JSB payload.
enum JSBDecodeProbe {
    private static let lock = NSLock()
    private static var gate: DispatchSemaphore?
    private static var callerReturned = false
    private static var decodedOnMainThread: Bool?
    private static var observedCallerReturned: Bool?

    /// Resets the probe. A non-nil `gate` makes the decoder block until the test
    /// releases it, which is how the test proves `handlerMessage` returned first.
    static func prepare(gate newGate: DispatchSemaphore?) {
        lock.lock()
        defer { lock.unlock() }
        gate = newGate
        callerReturned = false
        decodedOnMainThread = nil
        observedCallerReturned = nil
    }

    static func markCallerReturned() {
        lock.lock()
        defer { lock.unlock() }
        callerReturned = true
    }

    /// Called from inside the decoder to snapshot the decoding context.
    static func recordDecode() {
        lock.lock()
        let currentGate = gate
        lock.unlock()

        // A `handlerMessage` that decoded inline on the calling thread would
        // never see the signal, so this times out instead of deadlocking.
        _ = currentGate?.wait(timeout: .now() + 1)

        lock.lock()
        defer { lock.unlock() }
        decodedOnMainThread = Thread.isMainThread
        observedCallerReturned = callerReturned
    }

    static var decodeRanOnMainThread: Bool? {
        lock.lock()
        defer { lock.unlock() }
        return decodedOnMainThread
    }

    static var decodeSawCallerReturn: Bool? {
        lock.lock()
        defer { lock.unlock() }
        return observedCallerReturned
    }
}

/// Records the order in which `JSBOrderProbeCommand` payloads were decoded.
enum JSBOrderProbe {
    private static let lock = NSLock()
    private static var values: [Int] = []

    static func reset() {
        lock.lock()
        defer { lock.unlock() }
        values = []
    }

    static func record(_ value: Int) {
        lock.lock()
        defer { lock.unlock() }
        values.append(value)
    }

    static var decodedValues: [Int] {
        lock.lock()
        defer { lock.unlock() }
        return values
    }
}

/// Minimal JSB command whose decoder reports back through `JSBDecodeProbe`.
struct JSBThreadProbeCommand: CommandDataProtocol {
    static var commandType: String { "JSBThreadProbe" }

    let value: Int

    private enum CodingKeys: String, CodingKey {
        case value
    }

    init(from decoder: Decoder) throws {
        JSBDecodeProbe.recordDecode()
        let container = try decoder.container(keyedBy: CodingKeys.self)
        value = try container.decode(Int.self, forKey: .value)
    }
}

/// Minimal JSB command whose decoder reports back through `JSBOrderProbe`.
struct JSBOrderProbeCommand: CommandDataProtocol {
    static var commandType: String { "JSBOrderProbe" }

    let value: Int

    private enum CodingKeys: String, CodingKey {
        case value
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        value = try container.decode(Int.self, forKey: .value)
        JSBOrderProbe.record(value)
    }
}

final class JSBManagerThreadingTests: XCTestCase {
    /// Confirms payload decoding leaves the main thread and only starts after
    /// `handlerMessage` has already returned to its caller.
    func testHandlerMessageDecodesOffTheMainThreadAfterReturning() {
        let gate = DispatchSemaphore(value: 0)
        JSBDecodeProbe.prepare(gate: gate)

        let manager = JSBManager()
        manager.register(JSBThreadProbeCommand.self) { command, resolve in
            XCTAssertEqual(command.value, 7)
            resolve(.success(nil))
        }

        var replyOnMainThread: Bool?
        let replied = expectation(description: "probe reply")
        manager.handlerMessage("JSBThreadProbe::{\"value\":7}") { _, _ in
            replyOnMainThread = Thread.isMainThread
            replied.fulfill()
        }
        JSBDecodeProbe.markCallerReturned()
        gate.signal()

        wait(for: [replied], timeout: 5)
        XCTAssertEqual(JSBDecodeProbe.decodeRanOnMainThread, false)
        XCTAssertEqual(JSBDecodeProbe.decodeSawCallerReturn, true)
        XCTAssertEqual(replyOnMainThread, true)
    }

    /// Confirms a payload that fails to decode still replies on the main thread,
    /// where WebKit expects its script-message reply handlers to run.
    func testMalformedPayloadRepliesOnTheMainThread() {
        JSBDecodeProbe.prepare(gate: nil)

        let manager = JSBManager()
        manager.register(JSBThreadProbeCommand.self) { _, resolve in
            XCTFail("Malformed payloads must not reach the action")
            resolve(.success(nil))
        }

        var replyOnMainThread: Bool?
        var replyError: String?
        let replied = expectation(description: "malformed reply")
        manager.handlerMessage("JSBThreadProbe::{\"value\":\"seven\"}") { _, error in
            replyOnMainThread = Thread.isMainThread
            replyError = error
            replied.fulfill()
        }

        wait(for: [replied], timeout: 5)
        XCTAssertEqual(replyOnMainThread, true)
        XCTAssertNotNil(replyError)
    }

    /// Confirms unregistered commands report their failure on the main thread too.
    func testUnknownCommandRepliesOnTheMainThread() {
        let manager = JSBManager()

        var replyOnMainThread: Bool?
        var replyError: String?
        let replied = expectation(description: "unknown command reply")
        manager.handlerMessage("NotARegisteredCommand") { _, error in
            replyOnMainThread = Thread.isMainThread
            replyError = error
            replied.fulfill()
        }

        wait(for: [replied], timeout: 5)
        XCTAssertEqual(replyOnMainThread, true)
        XCTAssertEqual(replyError, "Invalid JSB!!! NotARegisteredCommand")
    }

    /// Confirms the serial command queue decodes payloads in the order the web
    /// layer sent them, even though messages are now handled asynchronously.
    func testPayloadsAreDecodedInSendOrder() {
        JSBOrderProbe.reset()

        let manager = JSBManager()
        manager.register(JSBOrderProbeCommand.self) { _, resolve in
            resolve(.success(nil))
        }

        let messageCount = 20
        let lastReplied = expectation(description: "last command reply")
        for index in 0 ..< messageCount {
            let message = "JSBOrderProbe::{\"value\":\(index)}"
            if index == messageCount - 1 {
                manager.handlerMessage(message) { _, _ in lastReplied.fulfill() }
            } else {
                manager.handlerMessage(message)
            }
        }

        // The last reply can only run once its own payload has been decoded, and
        // the serial queue decodes in order, so every decode has landed by now.
        wait(for: [lastReplied], timeout: 5)
        XCTAssertEqual(JSBOrderProbe.decodedValues, Array(0 ..< messageCount))
    }
}
