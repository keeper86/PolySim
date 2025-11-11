#pragma once

#include <filesystem>
#include <fstream>
#include <iomanip>
#include <iostream>
#include <openssl/evp.h>
#include <openssl/sha.h>
#include <openssl/types.h>
#include <sstream>
#include <string>
#include <vector>

namespace fs = std::filesystem;

inline static std::string make_sha256(const std::string &input) {
    EVP_MD_CTX *md_ctx = EVP_MD_CTX_new();
    const EVP_MD *md_alg = EVP_sha256();
    if (md_ctx == nullptr || md_alg == nullptr) {
        if (md_ctx != nullptr) {
            EVP_MD_CTX_free(md_ctx);
        }
        return {};
    }
    if (EVP_DigestInit_ex(md_ctx, md_alg, nullptr) != 1) {
        EVP_MD_CTX_free(md_ctx);
        return {};
    }
    if (EVP_DigestUpdate(md_ctx, input.data(), input.size()) != 1) {
        EVP_MD_CTX_free(md_ctx);
        return {};
    }
    std::vector<unsigned char> hash(EVP_MAX_MD_SIZE);
    unsigned int hash_len = 0;
    if (EVP_DigestFinal_ex(md_ctx, hash.data(), &hash_len) != 1) {
        EVP_MD_CTX_free(md_ctx);
        return {};
    }
    EVP_MD_CTX_free(md_ctx);
    std::ostringstream oss;
    for (unsigned int i = 0; i < hash_len; ++i) {
        oss << std::hex << std::setw(2) << std::setfill('0') << static_cast<int>(hash[i]);
    }
    return oss.str();
}

inline static std::string hash_file(const fs::path &path) {
    std::ifstream infile(path, std::ios::binary);
    if (!infile) {
        std::cerr << "Failed to open file for hashing: " << path.string() << '\n';
        throw std::runtime_error("Failed to open file for hashing: " + path.string());
    }

    EVP_MD_CTX *md_ctx = EVP_MD_CTX_new();
    const EVP_MD *md_alg = EVP_sha256();
    if (md_ctx == nullptr || md_alg == nullptr) {
        if (md_ctx != nullptr) {
            EVP_MD_CTX_free(md_ctx);
        }
        throw std::runtime_error("Failed to create EVP_MD_CTX or get EVP_sha256");
    }
    if (EVP_DigestInit_ex(md_ctx, md_alg, nullptr) != 1) {
        EVP_MD_CTX_free(md_ctx);
        throw std::runtime_error("Failed to initialize digest");
    }

    constexpr size_t HASH_BUF = 8192;
    std::vector<char> buf(HASH_BUF);
    while (infile.read(buf.data(), static_cast<std::streamsize>(buf.size())) ||
           infile.gcount() > 0) {
        if (EVP_DigestUpdate(md_ctx, buf.data(), static_cast<size_t>(infile.gcount())) != 1) {
            EVP_MD_CTX_free(md_ctx);
            throw std::runtime_error("Failed to update digest");
        }
    }

    std::vector<unsigned char> hash(EVP_MAX_MD_SIZE);
    unsigned int hash_len = 0;
    if (EVP_DigestFinal_ex(md_ctx, hash.data(), &hash_len) != 1) {
        EVP_MD_CTX_free(md_ctx);
        throw std::runtime_error("Failed to finalize digest");
    }
    EVP_MD_CTX_free(md_ctx);

    std::ostringstream oss;
    for (unsigned int i = 0; i < hash_len; ++i) {
        oss << std::hex << std::setw(2) << std::setfill('0') << static_cast<int>(hash[i]);
    }
    return oss.str();
}
