FROM ubuntu:22.04 AS builder

RUN apt-get update && \
    apt-get install -y build-essential cmake libssl-dev git && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /build
COPY . .

RUN cmake -S . -B build -DCMAKE_BUILD_TYPE=Release && \
    cmake --build build --config Release -- -j$(nproc)

FROM ubuntu:22.04

RUN apt-get update && \
    apt-get install -y libssl3 strace && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder /build/build/polysim_ctrace /usr/local/bin/

ENTRYPOINT ["/usr/local/bin/polysim_ctrace"]
