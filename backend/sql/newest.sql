WITH q AS (SELECT
    fi.issue_id,
    fi.issue_title,
    fi.issue_description,
    fi.location_id,
    fi.location_name,
    fi.location_department,
    fi.location_url,
    fi.location_description,
    fi.tags,
    fi.search_vector
FROM full_issues fi
INNER JOIN LATERAL (
    SELECT created_at, closed_at
    FROM reports
    WHERE issue_id = fi.issue_id
    ORDER BY created_at
    LIMIT 1
    ) r ON true
WHERE (fi.location_id = $1::uuid OR $1 IS NULL)
    AND (cardinality($2::text[]) = 0 OR fi.tags && $2::text[])
    AND ($3 OR r.closed_at IS NOT NULL)   -- if show_open=false, must be closed
    AND ($4 OR r.closed_at IS NULL)       -- if show_closed=false, must be open
    AND (r.created_at >= $5 OR $5 IS NULL)
    AND (r.created_at <= $6 OR $6 IS NULL)
ORDER BY r.created_at)
SELECT
    issue_id AS "issue_id!",
    issue_title,
    issue_description,
    location_id,
    location_name,
    location_department,
    location_url,
    location_description,
    tags AS "tags!"
FROM q