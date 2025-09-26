# PolySim

## Local Development

The development setup is as close to the production setup as possible.

### Certificates

In order for that to work, we need to create certificates for local domains once (mkcert is widely available):

```
mkdir certs
mkcert -cert-file certs/polysim.crt -key-file certs/polysim.key polysim auth.polysim
```

### Start dev

Start database and then the app

```sh
docker compose -f docker-compose.development.yaml --env-file .env.development up --build
```

Open [https://polysim](https://polysim) with your browser to see the result.

Dont forget:

```sh
docker compose -f docker-compose.development.yaml --env-file .env.development --volumes down
```

## Production

Copy .env.development over to .env, adapt the variables and run:

```sh
docker compose up --build
```

To stop and remove the containers run

```sh
docker compose down
```
