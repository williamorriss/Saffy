Saffy repository, mirror of https://github.com/williamorriss/Saffy.

In ./backend add:
- cert/key .pem for tls certificate
- .env file with DATABASE_URL = <database connection string>

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