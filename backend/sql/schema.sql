-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Locations table
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    latitude REAL,
    longitude REAL,
    building TEXT,
    level INTEGER NOT NULL,
    description TEXT
);

-- Issues table
CREATE TABLE issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    description TEXT,
    location_id UUID NOT NULL REFERENCES locations(id)
);

-- Reports table
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     issue_id UUID NOT NULL REFERENCES issues(id),
     reporter UUID NOT NULL REFERENCES users(id),
     description TEXT,
     created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
     closed_at TIMESTAMP
);

CREATE INDEX idx_issues_location_id ON issues(location_id);
CREATE INDEX idx_reports_issue_id ON reports(issue_id);