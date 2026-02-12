CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
   id SERIAL PRIMARY KEY,
   username TEXT NOT NULL UNIQUE,
   created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Locations table
CREATE TABLE locations (
   id SERIAL PRIMARY KEY,
   latitude REAL NOT NULL,
   longitude REAL NOT NULL,
   level INTEGER NOT NULL,
   description TEXT
);

-- Issues table
CREATE TABLE issues (
    id SERIAL PRIMARY KEY,
    description TEXT,
    location_id INTEGER NOT NULL REFERENCES locations(id),
    opened_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP
);

-- Reports table
CREATE TABLE reports (
     id SERIAL PRIMARY KEY,
     issue_id INTEGER NOT NULL REFERENCES issues(id),
     description TEXT,
     created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for foreign keys (good practice for performance)
CREATE INDEX idx_issues_location_id ON issues(location_id);
CREATE INDEX idx_reports_issue_id ON reports(issue_id);