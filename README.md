# PolySim

## Prerequisites

**Note:** The following setup has only been tested on **Ubuntu Linux**. Other distributions may require adjustments.

Before running PolySim, ensure the following tools are installed and configured on your system:

### Node.js and npm

Install [nvm](https://github.com/nvm-sh/nvm) and use it to install the node version specified in `.nvmrc`:

```sh
    # run in root of project
    nvm install
    nvm use  # only necessary if the auto-switch from .nvmrc is not configured
```

### Docker Setup

Install [docker](https://docs.docker.com/engine/install/).

- To stop and remove all running containers (brute-force cleanup):

```sh
    docker stop $(docker ps -a -q)
    docker rm $(docker ps -a -q)
```

- If you encounter permission issues with Docker and must run Docker commands as root, see:
  [How to fix Docker permission denied](https://stackoverflow.com/questions/48957195/how-to-fix-docker-permission-denied)

- If not already happened start the Docker daemon and enable it (should not be necessary):

```sh
    sudo systemctl start docker
    sudo systemctl enable docker
```

- You may need a [Docker account](https://hub.docker.com/) for pulling images, but usually not for public images.

## Production

### Initial Setup

Copy .env.development over to .env, adapt the variables.

A first-time deployment will import a default keycloak realm and client configuration. In order to set `rootUrl, adminUrl, baseUrl, redirectUris, and webOrigins` correctly, use the script to generate a valid initial realm config:

```
npm run generate-realm
```

This will read env variables and interpolate them into the template to create a valid initial realm config.

This can be adapted later in the Keycloak admin UI.

### Start

Then start the containers with

```sh
docker compose up
```

To stop and remove the containers run

```sh
docker compose down
```

## Local Development

The development setup is as close to the production setup as possible. First install dependencies.

```sh
npm i
```

### Automatically detect Docker host IP for extra_hosts

For robust local networking between containers and your host, the `DEV_ONLY_DOCKER_HOST_IP` variable in `.env.development` should match your Docker bridge IP (commonly `172.17.0.1` or `172.18.0.1`).

You can use this script to print out the Docker bridge IP before running Docker Compose:

```sh
DOCKER_BRIDGE_IP=$(ip -4 addr show docker0 | grep -oP '(?<=inet\s)\d+(\.\d+){3}')
if [ -n "$DOCKER_BRIDGE_IP" ]; then
  if grep -q '^DEV_ONLY_DOCKER_HOST_IP=' .env.development; then
    sed -i "s/^DEV_ONLY_DOCKER_HOST_IP=.*/DEV_ONLY_DOCKER_HOST_IP=$DOCKER_BRIDGE_IP/" .env.development
  else
    echo "DEV_ONLY_DOCKER_HOST_IP=$DOCKER_BRIDGE_IP" >> .env.development
  fi
  echo "Set DEV_ONLY_DOCKER_HOST_IP to $DOCKER_BRIDGE_IP in .env.development"
else
  echo "Could not detect docker0 bridge IP."
fi
```

### Certificates

We use self-signed certificates, we need to create certificates for local domains once (mkcert is widely available):

```
mkdir certs
mkcert -cert-file certs/polysim.crt -key-file certs/polysim.key polysim auth.polysim
```

The CI will create self-signed certs automatically. **DO NOT EVER** push certificates/secrets to the repo, not even development ones.

### Add hosts

Add the following line to your `/etc/hosts` file:

```text
127.0.0.1 polysim.local auth.polysim.local
```

or add it automatically (if not already present) with:

```sh
if ! grep -qxF '127.0.0.1 polysim.local auth.polysim.local' /etc/hosts; then
  echo '127.0.0.1 polysim.local auth.polysim.local' | sudo tee -a /etc/hosts
fi
```

These host entries are required so your browser can resolve the custom local domains (polysim.local and auth.polysim.local) to your local machine. This enables HTTPS and authentication to work correctly in the development environment.

### Start dev

Start database and then the app

```sh
docker compose -f docker-compose.development.yaml --env-file .env.development up --build
```

Open [https://polysim.local](https://polysim.local) with your browser to see the result.

Dont forget, when you are done:

```sh
docker compose -f docker-compose.development.yaml --env-file .env.development down
```

## Testing

### Unit Tests

Run unit tests using Vitest:

```sh
npm run test          # Run tests once
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage
```

### End-to-End Tests

This project includes Playwright-based e2e tests that validate the full application flow including authentication and API documentation.

Note: Install require **Playwright Browsers** and dependencies once before running tests:

```sh
npx playwright install
npx playwright install-deps
```

#### Running E2E Tests

```sh
npm run test:e2e           # Run all e2e tests
npm run test:e2e:headed    # Run tests with browser UI visible
npm run test:e2e:debug     # Run tests in debug mode
```

## Types

This project uses strict TypeScript for all application and API code. Key type conventions and patterns:

- All routes and navigation are type-safe, validated at compile time using the `nextjs-routes` package; See `src/lib/pageRoutes.ts` for details.
- API endpoints use Zod schemas for input/output validation and tRPC for end-to-end type safety.

### About `nextjs-routes`

[`nextjs-routes`](https://github.com/blitz-js/nextjs-routes) is a codegen tool that provides type-safe route autocompletion and validation for Next.js App Router projects. It scans your app directory and generates TypeScript types for all valid routes, ensuring that route paths used in your code are always correct and up-to-date. This eliminates hardcoded strings and prevents navigation errors at compile time.
