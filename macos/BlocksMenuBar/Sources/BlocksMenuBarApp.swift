import SwiftUI
import AppKit

@main
struct BlocksMenuBarApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) private var delegate

    var body: some Scene {
        MenuBarExtra {
            PopoverContent()
                .environment(delegate.state)
                .onAppear {
                    delegate.state.popoverOpen = true
                    Task { await delegate.state.refreshAll() }
                }
                .onDisappear {
                    delegate.state.popoverOpen = false
                }
        } label: {
            MenuBarLabel().environment(delegate.state)
        }
        .menuBarExtraStyle(.window)
    }
}

@MainActor
final class AppDelegate: NSObject, NSApplicationDelegate {
    let state = AppState()

    func applicationDidFinishLaunching(_ notification: Notification) {
        state.bootstrap()
    }

    func application(_ application: NSApplication, open urls: [URL]) {
        for url in urls {
            state.handleAuthCallback(url)
        }
    }
}
