import Foundation
import UserNotifications

@MainActor
enum Chime {
    static func notify(firstEntryId: Int, completed: Bool, activityName: String?) {
        let key = completed ? "chime-played:second:\(firstEntryId)" : "chime-played:\(firstEntryId)"
        guard !UserDefaults.standard.bool(forKey: key) else { return }
        UserDefaults.standard.set(true, forKey: key)

        let content = UNMutableNotificationContent()
        if completed {
            content.title = "Timer complete!"
            content.body = activityName ?? ""
        } else {
            content.title = "Half-time!"
            content.body = "Time to log what you worked on"
        }
        content.sound = UNNotificationSound(named: UNNotificationSoundName("chime-1.caf"))

        let request = UNNotificationRequest(identifier: key, content: content, trigger: nil)
        UNUserNotificationCenter.current().add(request)
    }
}
