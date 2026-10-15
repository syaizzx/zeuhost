.PHONY: help install dev build start test clean docker-up docker-down docker-logs

help:
	@echo "ZeuHost Management Commands:"
	@echo "  make install      Install all workspace dependencies"
	@echo "  make dev          Start development server on port 3000"
	@echo "  make build        Build all packages and web application"
	@echo "  make start        Run production server on port 3000"
	@echo "  make test         Execute end-to-end API integration tests"
	@echo "  make docker-up    Start full production stack with Docker Compose"
	@echo "  make docker-down  Stop all running ZeuHost Docker containers"
	@echo "  make docker-logs  Follow production Docker container logs"

install:
	bun install || npm install

dev:
	npm run dev

build:
	npm run build

start:
	npm run start

test:
	./scripts/test-api.sh

docker-up:
	docker compose -f deploy/docker-compose.yml --env-file deploy/.env up -d --build

docker-down:
	docker compose -f deploy/docker-compose.yml down

docker-logs:
	docker compose -f deploy/docker-compose.yml logs -f

clean:
	rm -rf node_modules apps/web/.next apps/web/node_modules packages/*/dist packages/*/node_modules
