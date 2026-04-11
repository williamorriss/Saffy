import json, psycopg2
from dotenv import load_dotenv
import os

load_dotenv()

def load_from_json() -> list[dict[str,str]]:
    with open("locations.json") as locations_json:
        data = json.load(locations_json)
    locations = data["response"]["resultPacket"]["results"]
    return [{"name" : row["listMetadata"]["t"][0], "department" : row["listMetadata"]["X"][0], "description": row["listMetadata"]["L"][0], "url": row["indexUrl"]} for row in locations]


def set_loc_table(locations: list[dict[str,str]]) -> None:
    with psycopg2.connect(os.getenv("DATABASE_URL")) as connection:
        with connection.cursor() as cursor:
            cursor.execute("TRUNCATE TABLE locations CASCADE")
            for location in locations:
                name = location["name"]
                department = location["department"]
                description = location["description"]
                url = location["url"]
                cursor.execute(
                "INSERT INTO locations (name, department, description, url) VALUES (%s, %s, %s, %s)",
                (name, department, description, url)
                )
            connection.commit()
            print(f"Loaded {len(locations)} locations")

if __name__ == "__main__":
    loaded = load_from_json()
    print(loaded)
    set_loc_table(loaded)