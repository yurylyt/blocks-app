import Foundation
import AppKit

@MainActor
final class Auth {
    static let shared = Auth()
    private init() {}

    private var sessionFile: URL {
        let base = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        let dir = base.appendingPathComponent("com.smerekatech.blocks.menubar", isDirectory: true)
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        return dir.appendingPathComponent("session")
    }

    func loadCookie() -> String? {
        guard let data = try? Data(contentsOf: sessionFile),
              let value = String(data: data, encoding: .utf8),
              !value.isEmpty else {
            return nil
        }
        return value
    }

    @discardableResult
    func saveCookie(_ value: String) -> Bool {
        let data = Data(value.utf8)
        do {
            try data.write(to: sessionFile, options: [.atomic, .completeFileProtection])
            try? FileManager.default.setAttributes(
                [.posixPermissions: 0o600],
                ofItemAtPath: sessionFile.path
            )
            return true
        } catch {
            NSLog("Auth.saveCookie failed: \(error)")
            return false
        }
    }

    func clearCookie() {
        try? FileManager.default.removeItem(at: sessionFile)
    }

    func startGoogleAuth() {
        let url = BlocksConfig.baseURL.appendingPathComponent("/auth/menubar-start")
        NSWorkspace.shared.open(url)
    }

    @discardableResult
    func handleCallback(_ url: URL) -> Bool {
        guard url.scheme == BlocksConfig.urlScheme else { return false }
        guard let comps = URLComponents(url: url, resolvingAgainstBaseURL: false),
              let session = comps.queryItems?.first(where: { $0.name == "session" })?.value,
              !session.isEmpty else {
            return false
        }
        return saveCookie(session)
    }
}
