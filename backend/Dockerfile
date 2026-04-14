FROM rust:1.94

# 1. Faster linking setup
RUN apt-get update && apt-get install -y mold clang
ENV RUSTFLAGS="-C link-arg=-fuse-ld=mold"

# 2. Tell SQLx to use the JSON file instead of trying to connect to the DB
ENV SQLX_OFFLINE=true

RUN cargo install cargo-watch

WORKDIR /app

COPY Cargo.toml Cargo.lock ./

# stops full recompilation except for dep change
RUN mkdir src && echo "fn main(){}" > src/main.rs
RUN cargo build
RUN rm src/main.rs

# * stops crash
COPY sqlx-data.json* ./
COPY src ./src
COPY sql ./sql

CMD ["cargo", "watch", "-x", "run"]