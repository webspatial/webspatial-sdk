class EventEmitter {
    private var listeners: [String: [(_ object: Any, _ data: Any) -> Void]] = [:]

    public func on(event: String, listener: @escaping (_ object: Any, _ data: Any) -> Void) {
        if listeners[event] == nil {
            listeners[event] = []
        }
        listeners[event]?.append(listener)
    }

    public func emit(event: String, data: Any) {
        listeners[event]?.forEach { listener in
            listener(self, data)
        }
    }

    public func off(event: String, listener: @escaping (_ object: Any, _ data: Any) -> Void) {
        listeners[event]?.removeAll(where: { $0 as AnyObject === listener as AnyObject })
    }

    // protected function
    func reset() {
        listeners = [:]
    }
}
