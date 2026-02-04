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
    unzip \
    jq \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /polytrace
COPY . /polytrace
RUN make build

CMD ["/bin/bash"]