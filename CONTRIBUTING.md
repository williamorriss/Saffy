Saffy repository, mirror of https://github.com/williamorriss/Saffy.

# Running in Development
For dev the database is containerised whilst the rest of the code should ***theoretically** work both locally and through containers.

## Database container
localhost vs db depending on whether backend is containerised
port 5433 not 5432 as background postgres may use 5432
make sure database url and pg_user etc match
```
DATABASE_URL=postgresql://dev:dev@localhost:5433/dev
PG_USER=dev
PG_PASSWORD=dev
PG_DATABASE=dev
```
(example .env)

### Make Commands
```bash
make db-init
```

### Start DB Session
```bash
make db-up
```

### Pause DB (Save Data)
```bash
make db-stop
```

### Resume DB
```bash
make db-start
```

### Drop DB
```bash
make db-drop
```

## Local Dev
See openapi.json for backend/ frontend api spec.

Debug backend server with:
``` bash
cd backend && RUST_LOG=DEBUG cargo run --bin backend
```

Run dev server with:
``` bash
cd frontend && npm run dev
```

Generate api types with:
``` bash
cd backend && cargo run --bin openapi && cd ../frontend && npm run gen-types
```

## Container Dev
.... untested