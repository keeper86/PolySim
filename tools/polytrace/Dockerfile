FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    build-essential \
    ca-certificates \
    cmake \
    clang-tidy \
    clang-format \
    libssl-dev \
    pkg-config \
    vim \
    strace \
 && rm -rf /var/lib/apt/lists/*

RUN git clone https://github.com/keeper86/PolySim
WORKDIR /PolySim/tools/polytrace

CMD ["/bin/bash"]