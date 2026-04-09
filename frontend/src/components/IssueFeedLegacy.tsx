import { type JSX, useState, useEffect } from "react";
import type {Issue, IssueQueryShow} from "../api/index";
import { client } from "../App";
import { z } from "zod";
import { DATE_START } from "./DateSlider";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/AuthContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { newIssueButton } from "./NewIssueButton"

const SearchSchema = z.object({search : z.string().default("")});

type SearchProps = {
    setIssues: (issues: Issue[]) => void,
    options: QueryFilter
};

type QueryProps = {
    setIssues: (issues: Issue[]) => void,
    setOptions: (query: QueryFilter) => void,
    options: QueryFilter
};

type QueryFilter = {
    show_open: boolean;
    show_closed: boolean;
    date_before: number | null;
    date_after: number | null;
}

const defaultQueryFilter: QueryFilter = {
    show_open: true,
    show_closed: false,
    date_before: DATE_START,
    date_after: Date.now(),
}


function getShow(options : QueryFilter): IssueQueryShow | undefined {
    if (options.show_open && options.show_closed) return "All";
    if (options.show_open) return "Open";
    if (options.show_closed) return "Closed";
    return undefined;
}

function SearchBar ({ setIssues, options } : SearchProps)  {
    const { register, watch, formState: {errors} } = useForm({
        resolver: zodResolver(SearchSchema),
    });

    const search = watch("search", "");
        const TIMEOUT: number = 250;

    useEffect(() => {
        if (errors.search) {
            return;
        }

        const show = getShow(options);
        console.log(show);
        console.log(options);

        const timeout = setTimeout(async () => {
            const ordering = search === "" ? "NewestFirst" : "Relevance";
            const {data} = await client.GET("/api/issues", {
                params: {
                    query : {
                        search,
                        ordering,
                        date_before: options.date_before,
                        date_after: options.date_after,
                        show
                    },
                },
            });
            if (data) {
                setIssues(data);
            }
        }, TIMEOUT);

        return () => clearTimeout(timeout);
    }, [search, errors.search, options]);

    return (
        <form>
            <input {...register("search")} placeholder="Searching...." />
            <input type="submit" />
        </form>
    );
}

function issuePanel({issue, navigate}: {issue: Issue, navigate: Function}): JSX.Element {
    return (
        <div key = {issue.id} className="border rounded-md p-4 mb-3 bg-white">
            <h3 className="text-base font-semibold mb-2 text-black">{issue.title}</h3>
            <p className="text-sm text-gray-600"> {issue.description} </p>
            <button onClick={() => navigate(`/issues/${issue.id}`)}/>
        </div>
    );
}

function QueryFilter({setIssues, options, setOptions}: QueryProps) {
    const [openChecked, setOpenChecked] = useState(options.show_open);
    const [closedChecked, setClosedChecked] = useState(options.show_closed);

    const toggleShowOpen = async () => {
        const show_open = !options.show_open;
        if (!show_open && !options.show_closed) {
            console.log(options);
            setOptions({...options, show_open, show_closed: true});
            setClosedChecked(true);
            setOpenChecked(false);
            return;
        }

        setOptions({...options, show_open});
        setOpenChecked(show_open)
    }

    const toggleShowClosed = async () => {
        const show_closed = !options.show_closed;
        if (!options.show_open && !show_closed) {
            console.log(options);
            setOptions({...options, show_closed, show_open: true});
            setClosedChecked(false);
            setOpenChecked(true);
            return;
        }

        setOptions({...options, show_closed})
        setClosedChecked(show_closed)
    }

    return (
        <>
            <label>
                <input
                    type="checkbox"
                    checked={openChecked}
                    onChange={toggleShowOpen}
                />
                showOpen
            </label>
            <label>
                <input
                    type="checkbox"
                    checked={closedChecked}
                    onChange={toggleShowClosed}
                />
                showClosed
            </label>
        </>
    );
}

export function IssueFeedLegacy() : JSX.Element {
    const [issues, setIssues] = useState<Issue[]>([])
    const [options, setOptions] = useState(defaultQueryFilter)
    const navigate = useNavigate();