#pragma once

#include <cstdlib>
#include <filesystem>
#include <fstream>
#include <iostream>
#include <nlohmann/json.hpp>
#include <optional>
#include <string>
#include <sys/stat.h>

namespace polytrace {

using json = nlohmann::json;

class ConfigManager {
  public:
    struct Config {
        std::string uploadUrl;
        std::string personalAccessToken;
    };

    ConfigManager() : configPath(getConfigPath()) {}

    static std::filesystem::path getConfigPath() {
        const char *xdgConfig = std::getenv("XDG_CONFIG_HOME");
        std::filesystem::path configDir;

        if ((xdgConfig != nullptr) && std::strlen(xdgConfig) > 0) {
            configDir = std::filesystem::path(xdgConfig) / "polysim";
        } else {
            const char *home = std::getenv("HOME");
            if (home == nullptr) {
                throw std::runtime_error("Cannot determine home directory: HOME environment "
                                         "variable not set");
            }
            configDir = std::filesystem::path(home) / ".config" / "polysim";
        }

        if (!std::filesystem::exists(configDir)) {
            std::filesystem::create_directories(configDir);
            // Set permissions to 0700 (rwx------)
            std::filesystem::permissions(configDir, std::filesystem::perms::owner_all,
                                         std::filesystem::perm_options::replace);
        }

        return configDir;
    }

    [[nodiscard]] std::filesystem::path getConfigFilePath() const {
        return configPath / "config.json";
    }

    [[nodiscard]] std::optional<Config> loadConfig() const {
        auto configFile = getConfigFilePath();

        if (!std::filesystem::exists(configFile)) {
            return std::nullopt;
        }

        // Check file permissions - must be 0600 (user read/write only)
        auto perms = std::filesystem::status(configFile).permissions();
        auto permsValue = std::filesystem::perms::owner_read | std::filesystem::perms::owner_write;
        if ((perms & (std::filesystem::perms::group_read | std::filesystem::perms::group_write |
                      std::filesystem::perms::others_read |
                      std::filesystem::perms::others_write)) != std::filesystem::perms::none) {
            throw std::runtime_error(
                "Config file has insecure permissions. Please set permissions to 0600 with: "
                "chmod 600 " +
                configFile.string());
        }

        std::ifstream file(configFile);
        if (!file.is_open()) {
            throw std::runtime_error("Failed to open config file: " + configFile.string());
        }

        try {
            json j;
            file >> j;

            Config config;
            if (j.contains("uploadUrl") && j["uploadUrl"].is_string()) {
                config.uploadUrl = j["uploadUrl"].get<std::string>();
            }
            if (j.contains("personalAccessToken") && j["personalAccessToken"].is_string()) {
                config.personalAccessToken = j["personalAccessToken"].get<std::string>();
            }

            return config;
        } catch (const std::exception &e) {
            throw std::runtime_error("Failed to parse config file: " + std::string(e.what()));
        }
    }

    void saveConfig(const Config &config) const {
        auto configFile = getConfigFilePath();

        json j;
        j["uploadUrl"] = config.uploadUrl;
        j["personalAccessToken"] = config.personalAccessToken;

        std::ofstream file(configFile);
        if (!file.is_open()) {
            throw std::runtime_error("Failed to create config file: " + configFile.string());
        }

        file << j.dump(2);
        file.close();

        // Set secure permissions (0600: user read/write only)
        std::filesystem::permissions(
            configFile, std::filesystem::perms::owner_read | std::filesystem::perms::owner_write,
            std::filesystem::perm_options::replace);
    }

    static Config interactiveSetup() {
        Config config;

        std::cout << "\n=== PolySim Upload Configuration Setup ===\n";
        std::cout << "This wizard will help you configure the upload settings.\n\n";

        std::cout << "Enter upload URL (e.g., http://localhost:3000):\n";
        std::getline(std::cin, config.uploadUrl);

        if (config.uploadUrl.empty()) {
            throw std::runtime_error("Upload URL cannot be empty");
        }

        std::cout << "\nEnter Personal Access Token (PAT):\n";
        std::getline(std::cin, config.personalAccessToken);

        if (config.personalAccessToken.empty()) {
            throw std::runtime_error("Personal Access Token cannot be empty");
        }

        return config;
    }

  private:
    std::filesystem::path configPath;
};

} // namespace polytrace
