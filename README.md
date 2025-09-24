# PolySim

## Getting Started

This NextJS-App is deployed via docker container. We use docker compose to start the app and additional services.

First install all dependencies

```bash
npm i
```

_Note:_ This creates a node_modules folder and will resolve all dependencies (including transient ones). If something seems 'fishy' with dependencies try to delete 'node_modules' and run "npm i" again.

### Local Development

The development setup is as close to the production setup as possible.

#### Certificates

In order for that to work, we need to create certificates for local domains once:

```
mkdir certs
mkcert -cert-file certs/polysim.crt -key-file certs/polysim.key polysim auth.polysim
```

#### Start dev

Start database and then the app

```bash
docker compose -f docker-compose.development.yaml --env-file .env.development up --build
```

Open [https://polysim](https://polysim) with your browser to see the result.

### Production

Copy over .env.development to .env and adapt the variables and run:

```bash
docker compose up --build
```

To stop and remove the containers run

```bash
docker compose down
```
