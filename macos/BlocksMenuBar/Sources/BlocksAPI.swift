import Foundation

enum APIError: Error {
    case notSignedIn
    case unauthorized
    case http(Int, String)
    case decoding(Error)
    case transport(Error)
}

@MainActor
final class BlocksAPI {
    static let shared = BlocksAPI()
    private init() {}

    private let decoder: JSONDecoder = {
        let d = JSONDecoder()
        d.dateDecodingStrategy = .iso8601
        return d
    }()
    private let encoder: JSONEncoder = {
        let e = JSONEncoder()
        e.dateEncodingStrategy = .iso8601
        return e
    }()

    func get<T: Decodable>(_ path: String, query: [URLQueryItem] = []) async throws -> T {
        let data = try await send(method: "GET", path: path, query: query, body: nil)
        return try decode(T.self, from: data)
    }

    func post<T: Decodable>(_ path: String) async throws -> T {
        let data = try await send(method: "POST", path: path, query: [], body: nil)
        return try decode(T.self, from: data)
    }

    func post<T: Decodable, B: Encodable>(_ path: String, body: B) async throws -> T {
        let bodyData = try encoder.encode(body)
        let data = try await send(method: "POST", path: path, query: [], body: bodyData)
        return try decode(T.self, from: data)
    }

    private func decode<T: Decodable>(_ type: T.Type, from data: Data) throws -> T {
        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw APIError.decoding(error)
        }
    }

    private func send(method: String, path: String, query: [URLQueryItem], body: Data?) async throws -> Data {
        guard let cookie = Auth.shared.loadCookie() else { throw APIError.notSignedIn }

        var components = URLComponents(url: BlocksConfig.baseURL.appendingPathComponent(path), resolvingAgainstBaseURL: false)!
        if !query.isEmpty { components.queryItems = query }
        guard let url = components.url else {
            throw APIError.http(-1, "bad URL")
        }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("\(BlocksConfig.cookieName)=\(cookie)", forHTTPHeaderField: "Cookie")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        if let body {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = body
        }

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await URLSession.shared.data(for: request)
        } catch {
            throw APIError.transport(error)
        }

        guard let http = response as? HTTPURLResponse else {
            throw APIError.http(-1, "no http response")
        }
        if http.statusCode == 401 {
            Auth.shared.clearCookie()
            throw APIError.unauthorized
        }
        guard (200...299).contains(http.statusCode) else {
            let body = String(data: data, encoding: .utf8) ?? ""
            throw APIError.http(http.statusCode, body)
        }
        return data
    }
}
