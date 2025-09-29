# PolySim

## Production

Copy .env.development over to .env, adapt the variables and run:

```sh
docker compose up --build
```

To stop and remove the containers run

```sh
docker compose down
```

## Local Development

The development setup is as close to the production setup as possible.

### Automatically detect Docker host IP for extra_hosts

For robust local networking between containers and your host, the `DOCKER_HOST_IP` variable in `.env.development` should match your Docker bridge IP (commonly `172.17.0.1` or `172.18.0.1`).

You can use this script to print out the Docker bridge IP before running Docker Compose:

```sh
ip -4 addr show docker0 | grep -oP '(?<=inet\s)\d+(\.\d+){3}'
```

Use the printed IP as the value for `DOCKER_HOST_IP` in your `.env.development` file if needed.

### Certificates

In order for that to work, we need to create certificates for local domains once (mkcert is widely available):

```
mkdir certs
mkcert -cert-file certs/polysim.crt -key-file certs/polysim.key polysim auth.polysim
```

The CI will create self-signed certs automatically. DO not EVER push certificates/secrets to the repo, not even development ones.

### Add hosts

Add the following lines to your `/etc/hosts` file:

```
127.0.0.1   polysim.local
127.0.0.1   auth.polysim.local
```

### Start dev

Start database and then the app

```sh
docker compose -f docker-compose.development.yaml --env-file .env.development up --build
```

Open [https://polysim](https://polysim) with your browser to see the result.

Dont forget, when you are done:

```sh
docker compose -f docker-compose.development.yaml --env-file .env.development --volumes down
```

## Testing

### Unit Tests

Run unit tests using Vitest:

```bash
npm run test          # Run tests once
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage
```

### End-to-End Tests

This project includes Playwright-based e2e tests that validate the full application flow including authentication and API documentation.

#### Prerequisites

1. **Development Environment**: Start the development server first:

    ```bash
    docker compose -f docker-compose.development.yaml --env-file .env.development up --build
    ```

2. **Playwright Browsers**: Install required browsers:
    ```bash
    npx playwright install
    ```

#### Running E2E Tests

```bash
npm run test:e2e           # Run all e2e tests
npm run test:e2e:headed    # Run tests with browser UI visible
npm run test:e2e:debug     # Run tests in debug mode
```

#### Test Coverage

The e2e tests cover:

- **Authentication**: Login with dev credentials (`adminuser`/`adminpassword`)
- **API Documentation**: Swagger UI accessibility at `/api-doc`
- **OpenAPI Specification**: JSON endpoint validation at `/api/openapi.json`
- **Session Management**: Navigation and session persistence

See `tests/e2e/README.md` for detailed testing documentation.
