SELECT issues.id, issues.title, issues.description, locations.name, locations.department, locations.url, locations.description, tags.id, tags.name FROM issues
INNER JOIN locations ON locations.id = issues.location_id
INNER JOIN issue_tags ON issue_tags.issue_id = issues.id
INNER JOIN tags ON tags.id = issue_tags.tag_id
INNER JOIN (
    SELECT issue_id, MIN(created_at) as earliest_report
    FROM reports
    WHERE (
        (closed_at IS NULL AND $1) -- is open
        OR (closed_at IS NOT NULL AND $2) -- is closed
    )
    AND (created_at >= $3 OR $3 IS NULL)
    AND (created_at <= $4 OR $4 IS NULL)
    GROUP BY issue_id
) r ON issues.id = r.issue_id
GROUP BY r.earliest_report, issues.id
ORDER BY r.earliest_report DESC