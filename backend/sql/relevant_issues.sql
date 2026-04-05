WITH ranked AS (
    SELECT
        issues.id,
        issues.title,
        issues.description,
        issues.location_id,
        ts_rank_cd(
                setweight(to_tsvector('english', issues.title), 'A') ||
                setweight(to_tsvector('english', issues.description), 'B') ||
                setweight(to_tsvector('english', COALESCE(r.combined_description, '')), 'C'),
                to_tsquery('english', $1)
        ) AS rank
    FROM issues
             LEFT JOIN (
        SELECT
            issue_id,
            MIN(created_at)              AS earliest_report,
            string_agg(description, ' ') AS combined_description
        FROM reports
        WHERE (
            (closed_at IS NULL     AND $2) -- is open
                OR (closed_at IS NOT NULL AND $3) -- is closed
            )
          AND (created_at >= $4 OR $4 IS NULL)
          AND (created_at <= $5 OR $5 IS NULL)
        GROUP BY issue_id
    ) r ON issues.id = r.issue_id
)
SELECT
    id,
    title,
    description,
    location_id
FROM ranked
ORDER BY rank DESC;