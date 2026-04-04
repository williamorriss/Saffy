import { useState, useEffect, useCallback } from "react";
import type {Issue, IssueQueryShow} from "../types/index";
import { client } from "../App";
import { DATE_START } from "../components/DateSlider";
import { z } from "zod";

const SearchSchema = z.object({search : z.string().default("")});

type QueryFilter = {
    show_open: boolean;
    show_closed: boolean;
    date_before: number | null;
    date_after: number | null;
    location: string | null;
    issue_type: string | null;
}

const defaultQueryFilter: QueryFilter = {
    show_open: true,
    show_closed: false,
    date_before: DATE_START,
    date_after: Date.now(),
    location: null,
    issue_type: null
}

function getShow(options : QueryFilter): IssueQueryShow | undefined {
    if (options.show_open && options.show_closed) return "All";
    if (options.show_open) return "Open";
    if (options.show_closed) return "Closed";
    return undefined;
}

export function useIssueFeed() {
    const [issues, setIssues] = useState<Issue[]>([]);
    const [options, setOptions] = useState<QueryFilter>(defaultQueryFilter);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    
    const performSearch = useCallback(async () => {
        setIsLoading(true);

        try {
            const show = getShow(options);
            const ordering = searchTerm === "" ? "NewestFirst" : "Relevance";
            const {data} = await client.GET("/api/issues", {
                params: {
                    query : {
                        search: searchTerm,
                        ordering,
                        date_before: options.date_before,
                        date_after: options.date_after,
                        show
                    },
                },
            });
            if (data) setIssues(data);
        }
        finally {
            setIsLoading(false);
        }
    }, [searchTerm, options])

    useEffect(() => {
        const timeoutID = setTimeout(performSearch, 250);
        return () => clearTimeout(timeoutID);
    }, [searchTerm, options, performSearch]);

    const setSearch = useCallback((searchTerm: string) => {
        const result = SearchSchema.safeParse({search: searchTerm});
        if (result.success) setSearchTerm(result.data.search);
    }, [])

    const updateFilter = (filter: Partial<QueryFilter>) => {
        setOptions(prev => ({...prev, ...filter}));
    }

    const refreshFeed = useCallback(() => {
        performSearch()
    }, [performSearch, searchTerm, options])

    return {
        issues,
        options,
        searchTerm,
        isLoading,
        setSearch,
        updateFilter,
        refreshFeed
    }
}