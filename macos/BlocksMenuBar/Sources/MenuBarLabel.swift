import SwiftUI

struct MenuBarLabel: View {
    @Environment(AppState.self) private var state

    var body: some View {
        switch state.mode {
        case .idle:
            Image(systemName: "square.grid.2x2")
        case .running:
            HStack(spacing: 4) {
                Image(systemName: "timer")
                Text(formatRemaining(state.remainingMs))
                    .font(.system(.body, design: .monospaced))
            }
        case .awaitingChoice:
            HStack(spacing: 4) {
                Image(systemName: "checkmark.circle.fill")
                Text("Done?")
            }
        }
    }

    private func formatRemaining(_ ms: Double) -> String {
        let total = max(0, Int(ms / 1000))
        let m = total / 60
        let s = total % 60
        return String(format: "%d:%02d", m, s)
    }
}
