import CoreFoundation

protocol WebMsgSender {
    func sendWebMsg(_ id: String, _ msg: Encodable)
}
