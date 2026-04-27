import SwiftUI

struct MenuBarLabel: View {
    @Environment(AppState.self) private var state

    var body: some View {
        switch state.mode {
        case .idle:
            Image(systemName: "square.grid.2x2")
        case .running:
            HStack(spacing: 5) {
                Circle()
                    .fill(Color(hex: state.currentActivity?.color ?? "#10b981"))
                    .frame(width: 7, height: 7)
                Text(state.currentLabel)
                Text(formatRemaining(state.remainingMs))
                    .monospacedDigit()
            }
        case .awaitingChoice:
            HStack(spacing: 5) {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundStyle(Color(hex: state.currentActivity?.color ?? "#10b981"))
                Text(state.currentLabel)
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
