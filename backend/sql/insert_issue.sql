WITH inserted AS (
    INSERT INTO issues (title, description, location_id)
        VALUES ($1, $2, $3)
        RETURNING id, title, description, location_id
)
SELECT
    inserted.id as issue_id,
    inserted.title as issue_title,
    inserted.description as issue_description,
    locations.id AS location_id,
    locations.name as location_name,
    locations.department as location_department,
    locations.url as location_url,
    locations.description AS location_description,
    array_agg(tags.name) AS tags
FROM inserted
         JOIN locations ON locations.id = inserted.location_id
         LEFT JOIN issue_tags ON issue_tags.issue_id = inserted.id
         LEFT JOIN tags ON tags.id = issue_tags.tag_id
GROUP BY
    inserted.id, inserted.title, inserted.description,
    locations.id, locations.name, locations.department, locations.url, locations.description