# PolySim

## Prerequisites

**Note:** The following setup has been tested on **Ubuntu Linux** and for **Windows Subsystem For Linux (WSL)**. Other distributions may require adjustments.

Before running PolySim, ensure the following tools are installed and configured on your system

### Node.js and npm

Install [nvm](https://github.com/nvm-sh/nvm) and use it to install the node version specified in `.nvmrc`:

```sh
    # run in root of project
    nvm install
    nvm use  # only necessary if the auto-switch from .nvmrc is not configured
```

### Docker Setup

Install [docker](https://docs.docker.com/engine/install/)

Troubleshooting tips:

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

Copy .env.example.production over to .env, adapt the variables. (See Below, do this before "Start" and "Local Developmet")

A first-time deployment will import a default keycloak realm and client configuration. In order to set `rootUrl, adminUrl, baseUrl, redirectUris, and webOrigins` correctly, use the script to generate a valid initial realm config:

```
npm run generate-realm
```

This will read env variables and interpolate them into the template to create a valid initial realm config.

The settings can be adapted later in the Keycloak admin UI.

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

Run the app locally and run infrastructure (Keycloak, database) in Docker.

### Initial Setup

Copy .env.example.development over to .env.

1. Copy .env.example.development over to .env

```sh
cp .env.example.development .env
```

Adapt the variables as needed as well as in the Keycloak configuration (see keycloak/data/devImport/myRealmDev.json). The defaults should work for most local development scenarios, but if something goes wrong, check the variables first.

2. Install dependencies

```sh
npm install
```

2. Start infrastructure (Keycloak, DB) in Docker

```sh
docker compose -f docker-compose.development.yaml up
```

3. Run the app locally

```sh
npm run db:waitFor
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000), Keycloak at [http://localhost:8080](http://localhost:8080) and the postgres database at [http://localhost:5432](http://localhost:5432).

**Note:** Make sure these ports are free and not used by other applications.

**Note:** Database migrations are run automatically every time you start the dev server with `npm run dev`. This ensures your local database schema is always up to date such that a restart of the dev server will execute any pending migrations.

**Note:** In development mode the database will be seeded with some demo data from the tests of polytrace. For more information consult: `/seeds/README.md`

4. Stopping services

When finished, stop Docker services with:

```sh
docker compose -f docker-compose.development.yaml down
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

The tests assume the development version of PolySim is running and accessible via `http://localhost:3000` (app) and `http://localhost:8080` (Keycloak) unlike unit tests.

This project includes Playwright-based e2e tests that validate the full application flow including authentication and API documentation.

Install required **Playwright Browsers** and dependencies once before running tests

```sh
npx playwright install
npx playwright install-deps
```

Run E2E Tests

```sh
npm run test:e2e           # Run all e2e tests
npm run test:e2e:headed    # Run tests with browser UI visible
npm run test:e2e:debug     # Run tests in debug mode
```

### CI

The CI pipeline is configured in `.github/workflows/website.yaml` and runs on every push and pull request. It’s preferable to run the required tests **locally** before pushing or creating a pull request. There are several methods/tools that make this easier:

---

#### _act_ : CI pipeline with a single command

[act](https://github.com/nektos/act) is an open-source tool that runs all tests and builds defined in `.github/workflows` locally by automatically pulling and building required Docker containers. Documentation can be reached by [here](https://nektosact.com).

If CI pipeline uses any Docker container, Docker Deamon needs to be running before using act.

act can be run from the projects directory by running:

```sh
act
```

#### Install for Linux

```sh
curl --proto '=https' --tlsv1.2 -sSf https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash
```

#### Install for MacOS

```sh
brew install act
```

#### Install for Windows

```sh
winget install nektos.act
```

---

#### Multi Line Testing

To run just part of the pipeline, you can run the required tests individually as shown below:

```sh
npm run format
npm run lint
npm run build
npm run test
```

To check whether a container can be built successfully, run

```sh
docker build . # can take a while
```

## Types

This project uses strict TypeScript for all application and API code. Key type conventions and patterns:

- All routes and navigation are type-safe, validated at compile time using the `nextjs-routes` package; See `src/lib/pageRoutes.ts` for details.
- API endpoints use Zod schemas for input/output validation and tRPC for end-to-end type safety.

### About `nextjs-routes`

[`nextjs-routes`](https://github.com/blitz-js/nextjs-routes) is a codegen tool that provides type-safe route autocompletion and validation for Next.js App Router projects. On build, it scans your app directory and generates TypeScript types for all valid routes, ensuring that route paths used in your code are always correct and up-to-date. This eliminates hardcoded strings and prevents navigation errors at compile time! If you add new pages or change existing routes, simply rebuild the project to regenerate the types.

### FAQ

#### Docker

- Limiting Docker resources on Windows: Configure WSL2 limits in `%USERPROFILE%\.wslconfig` (e.g., `memory`, `processors`). Details: https://dev.to/sarahcssiqueira/limiting-docker-memory-usage-on-windows-5c45
- Limiting Docker resources on Linux: Adjust resource limits in Docker settings (Docker Desktop or native daemon settings) as needed.
- Compose limits: Per\-service memory limits are configured in `docker-compose.development.yaml` under `deploy.resources.limits.memory`.
