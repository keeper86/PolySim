# PolySim

## Getting Started

This app is deployed via docker container. We use docker compose to start the app and additional services.

### Local Development

Start database and then the app

```bash
docker compose -f docker-compose.database.yaml up
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Production

```bash
docker compose -f docker-compose.yaml -f docker-compose.prod.yaml up
```

### Clean-up

To stop and remove the containers run

```bash
docker compose down
```
