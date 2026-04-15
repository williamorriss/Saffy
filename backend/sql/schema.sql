CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS users(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    department TEXT NOT NULL,
    url TEXT NOT NULL,
    description TEXT NOT NULL,
    search_vector tsvector
     GENERATED ALWAYS AS (
         to_tsvector('english',
                     coalesce(name, '')    || ' ' ||
                     coalesce(description, '')
         )
         ) STORED
);

CREATE TABLE IF NOT EXISTS issues (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     title TEXT NOT NULL,
     description TEXT NOT NULL,
     location_id UUID REFERENCES locations(id), -- can be nullable
     search_vector tsvector
         GENERATED ALWAYS AS (
             to_tsvector('english',
                         coalesce(title, '')       || ' ' ||
                         coalesce(description, '')
             )
             ) STORED
);

CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL
);


CREATE TABLE IF NOT EXISTS issue_tags (
  issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (issue_id, tag_id)
);


CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES issues(id),
  reporter_id UUID NOT NULL REFERENCES users(id),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMPTZ
);

-- views
CREATE VIEW full_issues AS
    SELECT
        i.id AS issue_id,
        i.title AS issue_title,
        i.description AS issue_description,
        l.id AS location_id,
        l.name AS location_name,
        l.department AS location_department,
        l.url AS location_url,
        l.description AS location_description,
        coalesce(array_agg(t.name) FILTER (WHERE t.name IS NOT NULL), '{}') AS tags,
        i.search_vector AS search_vector
    FROM issues i
    LEFT JOIN locations l ON l.id = i.location_id
    LEFT JOIN issue_tags it ON it.issue_id = i.id
    LEFT JOIN tags t ON t.id = it.tag_id
    GROUP BY
        i.id, i.title, i.description,
        l.id, l.name, l.department, l.url, l.description;


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