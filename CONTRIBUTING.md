Saffy repository, mirror of https://github.com/williamorriss/Saffy.

# Running in Development
For dev the database is containerised whilst the rest of the code should ***theoretically** work both locally and through containers.

## Database container
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