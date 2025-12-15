// Lightweight PROV client models + small HTTP helper
// Uses nlohmann::json (https://github.com/nlohmann/json)
// and cpp-httplib (https://github.com/yhirose/cpp-httplib)
#pragma once

#include <cstdint>
#include <httplib.h>
#include <iostream>
#include <nlohmann/json.hpp>
#include <optional>
#include <string>
#include <utility>
#include <vector>

namespace prov {
using json = nlohmann::json;

static constexpr int DEFAULT_PORT = 3000;
static constexpr int DEFAULT_TIMEOUT_SEC = 5;
static constexpr int HTTP_STATUS_OK_MIN = 200;
static constexpr int HTTP_STATUS_OK_MAX = 300;

struct Entity {
    std::string id; // sha256
    std::string label;
    json metadata = json::object();
    std::string role; // "input" | "output" | "process"
    std::optional<int64_t> createdAt;
};

struct Activity {
    std::string id;
    std::string label;
    int64_t startedAt;
    int64_t endedAt;
    json metadata = json::object();
};

struct ProvUploadInput {
    std::vector<Entity> entities;
    Activity activity;
};

inline void to_json(json &jsonObject, Entity const &entity) {
    jsonObject = json{{"id", entity.id},
                      {"label", entity.label},
                      {"metadata", entity.metadata},
                      {"role", entity.role}};
    if (entity.createdAt.has_value()) {
        jsonObject["createdAt"] = *entity.createdAt;
    }
}
inline void from_json(json const &jsonObject, Entity &entity) {
    entity.id = jsonObject.at("id").get<std::string>();
    entity.label = jsonObject.value("label", std::string());
    if (jsonObject.contains("metadata")) {
        entity.metadata = jsonObject.at("metadata");
    }
    entity.role = jsonObject.at("role").get<std::string>();
    if (jsonObject.contains("createdAt")) {
        entity.createdAt = jsonObject.at("createdAt").get<int64_t>();
    }
}

inline void to_json(json &jsonObject, Activity const &activity) {
    jsonObject = json{{"id", activity.id},
                      {"label", activity.label},
                      {"startedAt", activity.startedAt},
                      {"endedAt", activity.endedAt},
                      {"metadata", activity.metadata}};
}
inline void from_json(json const &jsonObject, Activity &activity) {
    activity.id = jsonObject.at("id").get<std::string>();
    activity.label = jsonObject.value("label", std::string());
    activity.startedAt = jsonObject.at("startedAt").get<int64_t>();
    activity.endedAt = jsonObject.at("endedAt").get<int64_t>();
    if (jsonObject.contains("metadata")) {
        activity.metadata = jsonObject.at("metadata");
    }
}

inline void to_json(json &jsonObject, ProvUploadInput const &provUploadInput) {
    jsonObject =
        json{{"entities", provUploadInput.entities}, {"activity", provUploadInput.activity}};
}
inline void from_json(json const &jsonObject, ProvUploadInput &provUploadInput) {
    provUploadInput.entities = jsonObject.at("entities").get<std::vector<Entity>>();
    provUploadInput.activity = jsonObject.at("activity").get<Activity>();
}

struct ProvClient {
    std::string host;
    int port;
    std::string basePath;
    std::optional<std::string> pat; // Personal Access Token
    bool use_ssl;

    ProvClient(std::string host = "127.0.0.1", int port = DEFAULT_PORT, std::string basePath = "",
               std::optional<std::string> pat_ = std::nullopt, bool use_ssl_ = false)
        : host(std::move(host)), port(port), basePath(std::move(basePath)), pat(std::move(pat_)),
          use_ssl(use_ssl_) {}

    [[nodiscard]] std::pair<bool, json>
    uploadActivity(const ProvUploadInput &input,
                   const std::string &path = "/upload-activity") const {
        json provUploadJson = input;

        httplib::Headers headers;
        if (pat.has_value()) {
            headers.emplace("Authorization", std::string("Bearer ") + *pat);
        } else {
            std::cerr << "Warning: No PAT provided, upload may be rejected by server\n";
        }

        auto post = [&](auto &cli) -> std::pair<bool, json> {
            cli.set_connection_timeout(DEFAULT_TIMEOUT_SEC);
            auto result = cli.Post((basePath + path).c_str(), headers, provUploadJson.dump(),
                                   "application/json");
            if (!result) {
                return {false, json{{"error", "network failure"}}};
            }
            if (result->status < HTTP_STATUS_OK_MIN || result->status >= HTTP_STATUS_OK_MAX) {
                try {
                    return {false, json::parse(result->body)};
                } catch (...) {
                    return {false, json{{"status", result->status}, {"body", result->body}}};
                }
            }
            try {
                return {true, json::parse(result->body)};
            } catch (...) {
                return {true, json{{"raw", result->body}}};
            }
        };
#ifdef CPPHTTPLIB_OPENSSL_SUPPORT
        if (use_ssl) {
            httplib::SSLClient cli(host, port);
            return post(cli);
        }
#else
        if (use_ssl) {
            return {false,
                    json{{"error", "SSL requested but CPPHTTPLIB_OPENSSL_SUPPORT not enabled"}}};
        }
#endif
        httplib::Client cli(host, port);
        return post(cli);
    }
};

} // namespace prov
