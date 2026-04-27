import SwiftUI
import AppKit

struct PopoverContent: View {
    @Environment(AppState.self) private var state

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            if !state.isSignedIn {
                signInView
            } else {
                switch state.mode {
                case .idle:
                    idleView
                case .running:
                    runningView
                case .awaitingChoice:
                    awaitingChoiceView
                }
                Divider()
                todayView
                Divider()
                actionsView
            }
            if let err = state.lastError {
                Text(err)
                    .font(.caption2)
                    .foregroundStyle(.red)
                    .lineLimit(2)
            }
        }
        .padding(12)
        .frame(width: 320)
    }

    private var signInView: some View {
        VStack(spacing: 8) {
            Text("Blocks").font(.title3.bold())
            Text("Sign in with Google to start tracking")
                .font(.caption)
                .foregroundStyle(.secondary)
            Button("Sign in with Google") { state.signIn() }
                .buttonStyle(.borderedProminent)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
    }

    private var idleView: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("Start timer").font(.headline)
            if state.activities.filter({ $0.archivedAt == nil }).isEmpty {
                Text("No activities yet. Create one in the web app.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            } else {
                ForEach(state.activities.filter { $0.archivedAt == nil }) { activity in
                    Button {
                        Task { await state.startTimer(activityId: activity.id) }
                    } label: {
                        HStack {
                            Circle()
                                .fill(Color(hex: activity.color))
                                .frame(width: 10, height: 10)
                            Text(activity.name)
                            Spacer()
                            Image(systemName: "play.fill")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .padding(.vertical, 3)
                }
            }
        }
    }

    private var runningView: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 8) {
                if let activity = state.currentActivity {
                    Circle()
                        .fill(Color(hex: activity.color))
                        .frame(width: 12, height: 12)
                    Text(activity.name).font(.headline)
                } else {
                    Text("Running…").font(.headline)
                }
                Spacer()
            }
            Text(formatRemaining(state.remainingMs))
                .font(.system(.title, design: .monospaced))
                .monospacedDigit()
            Button("Stop") { Task { await state.stopTimer() } }
                .buttonStyle(.bordered)
        }
    }

    private var awaitingChoiceView: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 8) {
                if let activity = state.currentActivity {
                    Circle()
                        .fill(Color(hex: activity.color))
                        .frame(width: 12, height: 12)
                    Text(activity.name).font(.headline)
                }
                Spacer()
            }
            Text("Half block done")
                .font(.subheadline)
                .foregroundStyle(.secondary)
            HStack(spacing: 8) {
                Button("Add second half") {
                    Task { await state.secondHalf() }
                }
                .buttonStyle(.borderedProminent)
                Button("Done") {
                    Task { await state.stopTimer() }
                }
                .buttonStyle(.bordered)
            }
        }
    }

    private var todayView: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Today").font(.headline)
            if state.entries.isEmpty {
                Text("Nothing logged yet")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            } else {
                ForEach(state.entries) { entry in
                    HStack(spacing: 8) {
                        let activity = state.activities.first { $0.id == entry.activityId }
                        Circle()
                            .fill(activity.map { Color(hex: $0.color) } ?? Color.gray)
                            .frame(width: 8, height: 8)
                        Text(activity?.name ?? entry.name ?? "—")
                            .lineLimit(1)
                        Spacer()
                        Text(formatBlocks(entry.blocks))
                            .font(.system(.body, design: .monospaced))
                            .monospacedDigit()
                            .foregroundStyle(.secondary)
                    }
                }
            }
        }
    }

    private var actionsView: some View {
        HStack {
            Button("Open in browser") { state.openWebApp() }
                .buttonStyle(.bordered)
            Spacer()
            Menu {
                Button("Refresh") { Task { await state.refreshAll() } }
                Button("Sign out") { state.signOut() }
                Divider()
                Button("Quit Blocks") { NSApp.terminate(nil) }
            } label: {
                Image(systemName: "gearshape")
            }
            .menuStyle(.borderlessButton)
            .frame(width: 36)
        }
    }

    private func formatRemaining(_ ms: Double) -> String {
        let total = max(0, Int(ms / 1000))
        let m = total / 60
        let s = total % 60
        return String(format: "%d:%02d", m, s)
    }

    private func formatBlocks(_ b: Double) -> String {
        b == floor(b) ? String(format: "%.0f", b) : String(format: "%.1f", b)
    }
}

extension Color {
    init(hex: String) {
        var s = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        if s.hasPrefix("#") { s.removeFirst() }
        var rgba: UInt64 = 0
        Scanner(string: s).scanHexInt64(&rgba)
        let r, g, b, a: Double
        switch s.count {
        case 6:
            r = Double((rgba & 0xFF0000) >> 16) / 255
            g = Double((rgba & 0x00FF00) >> 8) / 255
            b = Double(rgba & 0x0000FF) / 255
            a = 1
        case 8:
            r = Double((rgba & 0xFF000000) >> 24) / 255
            g = Double((rgba & 0x00FF0000) >> 16) / 255
            b = Double((rgba & 0x0000FF00) >> 8) / 255
            a = Double(rgba & 0x000000FF) / 255
        default:
            r = 0.5; g = 0.5; b = 0.5; a = 1
        }
        self.init(.sRGB, red: r, green: g, blue: b, opacity: a)
    }
}
