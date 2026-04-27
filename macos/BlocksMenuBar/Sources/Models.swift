import Foundation

struct Activity: Codable, Identifiable, Hashable {
    let id: Int
    let userId: Int
    let name: String
    let color: String
    let archivedAt: Date?
    let createdAt: Date
}

struct Entry: Codable, Identifiable, Hashable {
    let id: Int
    let userId: Int
    let activityId: Int?
    let name: String?
    let date: String
    let blocks: Double
    let position: Int
    let createdAt: Date
}

struct ApiTimer: Codable, Hashable {
    let activityId: Int?
    let name: String?
    let startedAt: Date
    let startedDate: String
    let half: Int
    let firstEntryId: Int?
    let elapsedMs: Double
}

struct TimerConfig: Codable, Hashable {
    let halfDurationMs: Double
    let halfBlockMinMs: Double
}

struct TimerResponse: Codable {
    let config: TimerConfig
    let timer: ApiTimer?
}

struct CompleteResult: Codable {
    let state: String
    let firstEntryId: Int?
}

struct EmptyResponse: Decodable {
    init(from decoder: Decoder) throws {}
}

enum TimerMode {
    case idle
    case running
    case awaitingChoice
}
