import { type JSX, useState, useEffect } from "react";
import type {Issue} from "../types/index";
import { client } from "../App";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const SearchSchema = z.object({search : z.string().default("")});

type SearchProps = { setIssues: (issues: Issue[]) => void };

function SearchBar ({ setIssues } : SearchProps)  {
    const { register, watch, formState: {errors} } = useForm({
        resolver: zodResolver(SearchSchema),
    });

    const search = watch("search", "");
        const TIMEOUT: number = 250;

    useEffect(() => {
        if (errors.search) return;

        const timeout = setTimeout(async () => {
            const ordering = search === "" ? "NewestFirst" : "Relevance";
            const {data} = await client.GET("/api/issues", {
                params: {
                    query : {search, ordering}
                },
            });
            if (data) {
                setIssues(data);
            }
        }, TIMEOUT);

        return () => clearTimeout(timeout);
    }, [search, errors.search]);

    return (
        <form>
            <input {...register("search")} placeholder="Searching...." />
            <input type="submit" />
        </form>
    );
}

function issuePanel(issue: Issue): JSX.Element {
    return (
        <div key = {issue.id} className="border rounded-md p-4 mb-3 bg-white">
            <h3 className="text-base font-semibold mb-2">{issue.title}</h3>
            <p className="text-sm text-gray-600"> {issue.description} </p>
        </div>
    );
}

export function IssueFeed() : JSX.Element {
    const [issues, setIssues] = useState<Issue[]>([])

    if (issues.length === 0) {
        return <> No issues found.</>
    }

    return (
        <>
            <SearchBar setIssues={setIssues} />
            ISSUES:
            {issues?.map(issuePanel)}
        </>
    );
}