CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    latitude REAL,
    longitude REAL,
    building TEXT,
    level INTEGER NOT NULL,
    description TEXT
);

CREATE TABLE issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    description TEXT,
    location_id UUID REFERENCES locations(id)
);

CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES issues(id),
    reporter_id UUID NOT NULL REFERENCES users(id),
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP
);

CREATE INDEX idx_issues_location_id ON issues(location_id);
CREATE INDEX idx_reports_issue_id ON reports(issue_id);

CREATE INDEX idx_reports_issue_id_created_at
    ON reports(issue_id, created_at);