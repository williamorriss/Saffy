### DOCKER

.PHONY: db-up
db-up:
	docker compose -f docker-compose.db.yml up -d db

.PHONY: db-down
db-down:
	docker compose -f docker-compose.db.yml down

.PHONY: db-init
db-init:
	docker compose -f docker-compose.db.yml --profile setup run --rm db-init && cd scripts && poetry run python load_dev.py

.PHONY: db-drop
db-drop:
	docker compose -f docker-compose.db.yml -f docker-compose.yml down -v

.PHONY: db-stop
db-stop:
	docker compose -f docker-compose.db.yml -f docker-compose.yml stop

.PHONY: db-start
db-start:
	docker compose -f docker-compose.db.yml -f docker-compose.yml start