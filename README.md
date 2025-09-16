# PolySim

## Getting Started

This NextJS-App is deployed via docker container. We use docker compose to start the app and additional services.

First install all dependencies

```bash
npm i
```

_Note:_ This creates a node_modules folder and will resolve all dependencies (including transient ones). If something seems 'fishy' with dependencies try to delete 'node_modules' and run "npm i" again.

### Local Development

Start database and then the app

```bash
docker compose -f docker-compose.database.yaml up
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Production

```bash
docker compose build app
docker compose -f docker-compose.yaml -f docker-compose.prod.yaml up
npx knex migrate:latest
```

### Clean-up

To stop and remove the containers run

```bash
docker compose down
```
