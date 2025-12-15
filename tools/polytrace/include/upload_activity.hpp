#pragma once

#include "prov_client.hpp"
#include <iostream>

using namespace prov;

int upload_activity(const std::string &host, int port, const std::string &basePath,
                    const std::string &PAT, const ProvUploadInput &payload, bool use_ssl = false) {
    prov::ProvClient client(host, port, basePath, PAT, use_ssl);

    auto [ok, res] = client.uploadActivity(payload);
    if (ok) {
        std::cout << "Success: " << res.dump(2) << '\n';
        return 0;
    }
    std::cerr << "Failed: " << res.dump(2) << '\n';
    return 2;
}