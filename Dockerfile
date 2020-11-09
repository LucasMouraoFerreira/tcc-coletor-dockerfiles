# syntax=docker/dockerfile:1.1.7-experimental

ARG CROSS="false"
ARG SYSTEMD="false"
# IMPORTANT: When updating this please note that stdlib archive/tar pkg is vendored
ARG GO_VERSION=1.13.15
ARG DEBIAN_FRONTEND=noninteractive
ARG VPNKIT_VERSION=0.4.0
ARG DOCKER_BUILDTAGS="apparmor seccomp selinux"

ARG BASE_DEBIAN_DISTRO="buster"
ARG GOLANG_IMAGE="golang:${GO_VERSION}-${BASE_DEBIAN_DISTRO}"

FROM ${GOLANG_IMAGE} AS base
RUN echo 'Binary::apt::APT::Keep-Downloaded-Packages "true";' > /etc/apt/apt.conf.d/keep-cache
ARG APT_MIRROR # ac
RUN sed -ri "s/(httpredir|deb).debian.org/${APT_MIRROR:-deb.debian.org}/g" /etc/apt/sources.list \
 && sed -ri "s/(security).debian.org/${APT_MIRROR:-security.debian.org}/g" /etc/apt/sources.list
ENV GO111MODULE=off

FROM base AS criu
ARG DEBIAN_FRONTEND
# Install dependency packages specific to criu
RUN --mount=type=cache,sharing=locked,id=moby-criu-aptlib,target=/var/lib/apt \
    --mount=type=cache,sharing=locked,id=moby-criu-aptcache,target=/var/cache/apt \
        apt-get update && apt-get install -y --no-install-recommends \
            libcap-dev \
            libnet-dev \
            libnl-3-dev \
            libprotobuf-c-dev \
            libprotobuf-dev \
            protobuf-c-compiler \
            protobuf-compiler \
            python-protobuf

# Install CRIU for checkpoint/restore support
ARG CRIU_VERSION=3.14
RUN mkdir -p /usr/src/criu \
    && curl -sSL https://github.com/checkpoint-restore/criu/archive/v${CRIU_VERSION}.tar.gz | tar -C /usr/src/criu/ -xz --strip-components=1 \
    && cd /usr/src/criu \
    && make \
    && make PREFIX=/build/ install-criu
