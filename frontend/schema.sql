-- SQL script to make database

PRAGMA foreign_keys = ON;
CREATE TABLE users (
   id INTEGER PRIMARY KEY AUTOINCREMENT,
   username TEXT NOT NULL UNIQUE,
   created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE locations (
   id INTEGER PRIMARY KEY AUTOINCREMENT,
   latitude REAL NOT NULL,
   longitude REAL NOT NULL,
   level INT NOT NULL,
   description TEXT
);

CREATE TABLE issues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT,
    location_id INTEGER REFERENCES locations(id) NOT NULL,
    opened_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at  DATETIME
);

CREATE TABLE reports (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     issue_id INTEGER REFERENCES issues(id) NOT NULL,
     description TEXT,
     created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);