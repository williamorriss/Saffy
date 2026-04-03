import { type JSX, useState, useEffect } from "react";
import type {Issue, IssueQueryShow} from "../types/index";
import { client } from "../App";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DATE_START } from "./DateSlider";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

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

function SearchBar ({ setIssues, options } : SearchProps) {
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
      <form className="flex w-full gap-4 p-4">
        <input 
          {...register("search")} 
          placeholder="Searching...." 
          className="flex-1 w-7/8 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
        />
        <input 
          type="submit" 
          className="w-1/8 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer"
        />
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

function newIssueButton(navigate: Function) {
    const { isLoggedIn } = useAuth();

    if (!isLoggedIn()) {
        return (
            <div className="relative group">
                <button 
                    onClick={() => {}} 
                    disabled 
                    className="px-4 py-2 bg-gray-400 text-gray-600 rounded-lg cursor-not-allowed opacity-50"
                >
                    New Issue
                </button>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-sm rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    Log in to create a new issue
                </div>
            </div>
        );
    }

    return (
        <button 
            onClick={() => navigate("/issues/new")} 
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
            New Issue
        </button>
    );
}

export function IssueFeed() : JSX.Element {
    const [issues, setIssues] = useState<Issue[]>([])
    const [options, setOptions] = useState(defaultQueryFilter)
    const navigate = useNavigate();


    useEffect(() => {
        const fetch = async () => {
            const {data} = await client.GET("/api/issues", {});
            if (data) {
                setIssues(data);
            }
        }
        fetch();
    }, []);

   const displayIssues = issues.length === 0
       ? <> No issues found.</>
       : issues?.map((issue) => issuePanel({issue, navigate}));

    return (
        <> 
            <div className="w-full flex justify-between px-6 pb-0 pt-4">
              <div className="flex items-center gap-4">
                <nav className="flex items-center gap-4">
                  {newIssueButton(navigate)}
                </nav>
              </div>

              <div className="flex items-center gap-4">
                <nav className="flex items-center gap-4">
                  <QueryFilter setIssues={setIssues} options = {options} setOptions={setOptions} /> 
                </nav>
              </div>
            </div>

            <SearchBar setIssues={setIssues} options = {options} />
            ISSUES:
            {displayIssues}
        </>
    );
}