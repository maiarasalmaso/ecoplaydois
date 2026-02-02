# Database Setup

This directory contains the database schema and seed data for the EcoPlay / Antigravity project.

## Structure

- `schema/`: Contains DDL scripts to create tables, indexes, and views.
- `seeds/`: Contains DML scripts to populate the database with initial data for development.

## Getting Started

### Prerequisites

- Docker and Docker Compose installed.

### Running the Database

We have provided a `docker-compose.yml` file in the project root. To start the PostgreSQL database:

1. Open a terminal in the project root.
2. Run:
   ```bash
   docker-compose up -d
   ```
   This will start a Postgres 15 container.

3. The container is configured to **automatically run** the scripts in `database/schema` and `database/seeds` upon the *first* startup (when the volume is created).

### Accessing the Database

- **Host:** localhost
- **Port:** 5432
- **User:** admin
- **Password:** password
- **Database:** ecoplay

You can connect using any SQL client (DBeaver, pgAdmin) or via command line:

```bash
docker exec -it ecoplay_db psql -U admin -d ecoplay
```

### Resetting the Database

To wipe the database and start fresh (re-running schemas and seeds):

```bash
docker-compose down -v
docker-compose up -d
```
