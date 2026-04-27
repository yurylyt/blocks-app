import Foundation
import AVFoundation

@MainActor
enum Chime {
    private static var player: AVAudioPlayer?

    static func playOnce(firstEntryId: Int, second: Bool) {
        let key = second ? "chime-played:second:\(firstEntryId)" : "chime-played:\(firstEntryId)"
        if UserDefaults.standard.bool(forKey: key) { return }
        UserDefaults.standard.set(true, forKey: key)
        guard let url = Bundle.main.url(forResource: "chime-1", withExtension: "mp3") else { return }
        do {
            player = try AVAudioPlayer(contentsOf: url)
            player?.volume = 0.7
            player?.play()
        } catch {
            // ignore playback failures
        }
    }
}
