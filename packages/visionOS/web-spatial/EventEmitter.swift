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
}

protocol EventEmitterProtocol{
    var listeners: [String: [(_ object: Any, _ data: Any) -> Void]] {get set}
    
    mutating func on(event: String, listener: @escaping (_ object: Any, _ data: Any) -> Void)
    func emit(event: String, data: Any)
    mutating func off(event: String, listener: @escaping (_ object: Any, _ data: Any) -> Void)
    mutating func reset()
}

extension EventEmitterProtocol{
    mutating func on(event: String, listener: @escaping (_ object: Any, _ data: Any) -> Void) {
        if listeners[event] == nil {
            listeners[event] = []
        }
        listeners[event]?.append(listener)
    }

    func emit(event: String, data: Any) {
        listeners[event]?.forEach { listener in
            listener(self, data)
        }
    }

    mutating func off(event: String, listener: @escaping (_ object: Any, _ data: Any) -> Void) {
        listeners[event]?.removeAll(where: { $0 as AnyObject === listener as AnyObject })
    }
    
    mutating func reset(){
        listeners = [:]
    }
}
