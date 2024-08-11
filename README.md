# WAX RAM Free

[![Netlify Status](https://api.netlify.com/api/v1/badges/25725105-c7ea-4065-8cf5-3d920a4bd413/deploy-status)](https://app.netlify.com/sites/wax-free-ram/deploys)

Tool to free up WAX blockchain RAM (a non-consumable resource) on the WAX Blockchain caused by failed pack openings:

![Screenshot](./public/screenshot.png)

## Prerequisites

Do this or it won't work, I'm talking to you future me.

1. Install PNP with brew/apt/snap/winget/etc
2. Setup PNP with `pnp setup`

## Develop

```
pnp install
pnp dev
```

or, if you have Podman or Docker installed:

```
docker build . -t wax-ram-free:latest
docker run --publish 4321:4321 localhost/wax-ram-free
```

## Test-Buikd

```
pnp run astro build
```
