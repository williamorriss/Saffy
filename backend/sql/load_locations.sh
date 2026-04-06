#!/bin/bash
DIR="$(dirname "$0")"
psql "$DATABASE_URL" -U postgres -d knowledb -c "\copy locations (name, description) FROM '$DIR/locations.csv' DELIMITER ',' CSV HEADER;"