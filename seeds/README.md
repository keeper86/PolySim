# Dev Database Auto-Seeding with PROV Test Data

The local development workflow by ensuring that the development database is automatically created and populated with PROV test data when running the project. That means running

```
npm run dev
```

will now create and seed the development database if it does not already exist.

## Data Source

The dev database is seeded using polytrace-generated PROV fixtures, providing realistic and consistent and realistic provenance data.

1. One-time polytrace setup (see `tools/polytrace/README.md`)

```
  # navigate to polytrace directory
  make test
```

This generates PROV fixture files under:
      tools/polytrace/test/fixtures/tmp/prov_upload_input/

Only re-run when polytrace test data changes.


## Verification

How to verify auto-seeding works

1. Restart the db by restarting the container (see main README for more info)

2. Run `npm run dev` to start the app (this will auto-create and seed the dev database if it does not exist)

3. (optional) VS code -> Extension -> Install Database Client JDBC (seeded data will be visible immediately after running)

### Useful commands
npm run dev # migrate + seed + start app
npm run dev:only # start app without touching the DB
npm run db:seed # re-seed dev database manually
