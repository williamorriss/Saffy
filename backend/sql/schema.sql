CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS users(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    search_vector tsvector
        GENERATED ALWAYS AS (
            to_tsvector('english',
            coalesce(name, '')    || ' ' ||
            coalesce(description, '')
        )
        ) STORED
);

CREATE TABLE IF NOT EXISTS issues(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    description TEXT,
    location_id UUID REFERENCES locations(id),
    search_vector tsvector
        GENERATED ALWAYS AS (
            to_tsvector('english',
                coalesce(title, '')       || ' ' ||
                coalesce(description, '')
            )
        ) STORED
);

CREATE TABLE IF NOT EXISTS reports (
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

-- vector indices
CREATE INDEX issue_fts_idx    ON issues    USING GIN(search_vector);
CREATE INDEX location_fts_idx ON locations USING GIN(search_vector);

-- trgm indices
CREATE INDEX issue_trgm_title ON issues    USING GIN(title       gin_trgm_ops);
CREATE INDEX issue_trgm_desc  ON issues    USING GIN(description gin_trgm_ops);
CREATE INDEX loc_trgm_name ON locations USING GIN(name gin_trgm_ops);