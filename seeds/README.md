Title : Auto-create and seed dev database with PROV test data on startup

description :
The local development workflow by ensuring that the development database is automatically created and populated with PROV test data when running the project.
The dev database is seeded using polytrace-generated PROV fixtures, providing realistic and consistent provenance data without requiring manual setup.

What’s included

- Knex seed that converts polytrace PROV fixture files into database records
- Automatic insertion of:
- entities
- activities (at least 20 diverse activities)
- agents
- Full PROV relations (used, wasGeneratedBy, wasAssociatedWith, wasAttributedTo, wasInformedBy)
- Updated package.json scripts to manage dev DB lifecycle
- Dev database is created and seeded automatically on npm run dev
- No changes to production behaviour

How to run the dev database

1. One-time setup (polytrace prerequisites)
   Polytrace requires CMake and a C++ build toolchain:
   sudo apt update
   sudo apt install -y cmake build-essential

2. Generate PROV fixture data (only when fixtures change)
    - cd tools/polytrace
    - make test
    - This generates PROV fixture files under:
      tools/polytrace/test/fixtures/tmp/prov_upload_input/
    - This step is not required on every run.
    - Only re-run when polytrace test data changes.

3. Start the project (DB auto-created)
    - npm run dev

How to verify auto-seeding works

1.Empty the dev database:

- npx knex migrate:rollback --all --env development
  2.Start the app:npm run dev
  3.Verify data exists:Expected result: ≥ 20 activities

4. VS code -> Extension -> Install Database Client JDBC (seeded data will be visible immediately after running)

useful commands
npm run dev # migrate + seed + start app
npm run dev:only # start app without touching the DB
npm run db:seed # re-seed dev database manually
