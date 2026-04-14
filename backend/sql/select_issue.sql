SELECT
    issues.id as issue_id,
    issues.title as issue_title,
    issues.description as issue_description,
    locations.id AS location_id,
    locations.name as location_name,
    locations.department as location_department,
    locations.url as location_url,
    locations.description AS location_description,
    array_agg(tags.name) AS tags
FROM issues
         JOIN locations ON locations.id = issues.location_id
         LEFT JOIN issue_tags ON issue_tags.issue_id = issues.id
         LEFT JOIN tags ON tags.id = issue_tags.tag_id
WHERE issues.id = $1
GROUP BY
    issues.id, issues.title, issues.description,
    locations.id, locations.name, locations.department, locations.url, locations.description