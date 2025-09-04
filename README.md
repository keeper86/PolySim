# PolySim

## Getting Started

This app is deployed via docker container. We use docker compose to start the app and additional services.

### Development

```bash
docker compose up
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Production

```bash
docker compose -f docker-compose.yaml -f docker-compose.prod.yaml up
```
