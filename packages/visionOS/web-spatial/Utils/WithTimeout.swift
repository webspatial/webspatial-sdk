struct TimeoutError: Error {}

// Replace with Swift 6.5 withDeadline
// https://github.com/swiftlang/swift-evolution/blob/main/proposals/0526-deadline.md

func withTimeout<Result: Sendable>(
    _ duration: Duration,
    operation: @escaping @Sendable () async throws -> Result
) async throws -> Result {
    let deadline = ContinuousClock.now.advanced(by: duration)
    return try await withThrowingTaskGroup(of: Result.self) { group in
        defer { group.cancelAll() }
        group.addTask { try await operation() }
        group.addTask {
            try await Task.sleep(until: deadline, clock: .continuous)
            throw TimeoutError()
        }
        let result = try await group.next()!
        try Task.checkCancellation()
        return result
    }
}
