Saffy repository, mirror of https://github.com/williamorriss/Saffy.

In ./backend add:
- ~~key.pem and cert.pem~~ Should be able to run as http now!
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

> DO NOT TRUST THE OLD README (wrangler is for cloudflare, it cannot help you here)