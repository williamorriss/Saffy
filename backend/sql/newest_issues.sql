SELECT
    issues.id as issue_id,
    issues.title as "issue_title?",
    issues.description as "issue_description?",
    locations.id as "location_id?",
    locations.name as "location_name?",
    locations.department as "location_department?",
    locations.url as "location_url?",
    locations.description as "location_description?",
    array_agg(tags.name) FILTER (WHERE tags.name IS NOT NULL) AS "tags?"
FROM issues
         LEFT JOIN locations ON locations.id = issues.location_id
         LEFT JOIN issue_tags ON issue_tags.issue_id = issues.id
         LEFT JOIN tags ON tags.id = issue_tags.tag_id
         INNER JOIN (
    SELECT issue_id, MIN(created_at) as earliest_report
    FROM reports
    WHERE (
        (closed_at IS NULL AND $1)
            OR (closed_at IS NOT NULL AND $2)
        )
      AND (created_at >= $3 OR $3 IS NULL)
      AND (created_at <= $4 OR $4 IS NULL)
    GROUP BY issue_id
) r ON issues.id = r.issue_id
GROUP BY
    r.earliest_report,
    issues.id,
    issues.title,
    issues.description,
    locations.id,
    locations.name,
    locations.department,
    locations.url,
    locations.description
ORDER BY r.earliest_report DESC