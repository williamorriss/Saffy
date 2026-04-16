import json, psycopg2
import csv
from dotenv import load_dotenv
import os
from psycopg2.extras import execute_batch
import psycopg2.extensions

type Connection = psycopg2.extensions.connection

load_dotenv()

def load_schema() -> str:
    with open("../backend/sql/schema.sql") as schema_file:
        return schema_file.read()

def load_drop() -> str:
    with open("../backend/sql/drop.sql") as schema_file:
        return schema_file.read()

def load_locations() -> list[dict[str,str]]:
    with open("locations.json") as locations_json:
        return json.load(locations_json)

def load_tags() -> list[dict[str, str]]:
    with open("tags.csv", 'r') as tag_file:
        tags = csv.DictReader(tag_file)
        return [tag for tag in tags]

def set_tags_table(db: Connection, tags: list[dict[str,str]]) -> None:
    with db.cursor() as cursor:
        cursor.execute("TRUNCATE TABLE tags CASCADE")
        execute_batch(cursor, "INSERT INTO tags (name) VALUES (%(name)s)", tags)

    db.commit()
    print(f"Loaded {len(tags)} tags")


def set_loc_table(db: Connection, locations: list[dict[str,str]]) -> None:
    with db.cursor() as cursor:
        cursor.execute("TRUNCATE TABLE locations CASCADE")
        execute_batch(cursor, "INSERT INTO locations (name, department, description, url) VALUES (%(name)s, %(department)s, %(description)s, %(url)s)", locations )
    db.commit()
    print(f"Loaded {len(locations)} locations")

def main() -> None:
    db_url = os.getenv("DATABASE_URL")
    print(db_url)
    with psycopg2.connect(db_url) as db:
        drop = load_drop()
        schema = load_schema()
        with db.cursor() as cursor:
            cursor.execute(drop)
            cursor.execute(schema)
        db.commit()
        loaded = load_locations()
        tags = load_tags()
        print(loaded)
        set_loc_table(db, loaded)
        print(tags)
        set_tags_table(db, tags)


if __name__ == "__main__":
    main()