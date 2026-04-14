WITH filtered AS (
    SELECT issues.id
    FROM issues
    LEFT JOIN issue_tags ON issue_tags.issue_id = issues.id
    WHERE (CARDINALITY($6::uuid[]) = 0 OR issue_tags.tag_id = ANY($6::uuid[]))
      AND ($7::uuid IS NULL OR issues.location_id = $7::uuid)
    GROUP BY issues.id
    HAVING (CARDINALITY($6::uuid[]) = 0 OR COUNT(DISTINCT issue_tags.tag_id) = CARDINALITY($6::uuid[]))
),
     r AS (
         SELECT
             issue_id,
             string_agg(description, ' ') AS combined_description
         FROM reports
         WHERE (closed_at IS NULL AND $2 OR closed_at IS NOT NULL AND $3)
           AND (created_at >= $4 OR $4 IS NULL)
           AND (created_at <= $5 OR $5 IS NULL)
         GROUP BY issue_id
     )
SELECT
    issues.id AS issue_id,
    issues.title AS "issue_title?",
    issues.description AS "issue_description?",
    locations.id AS "location_id?",
    locations.name AS "location_name?",
    locations.department AS "location_department?",
    locations.url AS "location_url?",
    locations.description AS "location_description?",
    array_agg(tags.name) FILTER (WHERE tags.name IS NOT NULL) AS "tags?"
FROM filtered
     LEFT JOIN issues ON issues.id = filtered.id
     LEFT JOIN locations ON locations.id = issues.location_id
     LEFT JOIN issue_tags ON issue_tags.issue_id = issues.id
     LEFT JOIN tags ON tags.id = issue_tags.tag_id
     INNER JOIN r ON r.issue_id = issues.id
GROUP BY
    issues.id,
    issues.title,
    issues.description,
    locations.id,
    locations.name,
    locations.department,
    locations.url,
    locations.description,
    issues.search_vector
ORDER BY ts_rank_cd(
    issues.search_vector || setweight(to_tsvector('english', COALESCE(MAX(r.combined_description), '')), 'C'),
    to_tsquery('english', $1)
    ) DESC