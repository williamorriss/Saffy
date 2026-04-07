#!/bin/bash
DIR="$(dirname "$0")"
psql "$DATABASE_URL" -U postgres -d knowledb -c "\copy tags (name) FROM '$DIR/tags.csv' DELIMITER ',' CSV HEADER;"