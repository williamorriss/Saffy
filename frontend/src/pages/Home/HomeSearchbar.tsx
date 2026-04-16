import {type IssueQuery, type Issue, client, type IssueQueryOrder, type IssueQueryShow} from "../../api";
import {type JSX, useEffect, useRef, useState} from "react";
// set search Params
import LocationSearch from "../../components/LocationSearch";
import { X, Search, ArrowDown } from "lucide-react";
import TagSelectionBox from "../../components/TagSelectionBox";
import IssueStatusSelect from "../../components/IssueStatusSelect";
import * as React from "react";

const defaultQuery: IssueQuery = {
    search: undefined,
    show: undefined,
    location: undefined,
    dateAfter: undefined,
    dateBefore: undefined,
    ordering: undefined,
    tags: []
}

export default function HomeSearchbar({setIssues} : {setIssues: (issues: Issue[]) => void}) {
    const [query, setQuery] = useState<IssueQuery>(defaultQuery);
    const setSearch = (search: string | undefined) => setQuery(q => ({...q, search}));
    const setShow = (show: IssueQueryShow) => setQuery(q => ({...q, show}));
    const setLocation = (location: string | undefined) => setQuery(q => ({...q, location}));
    const setTags = (tags: string[]) => setQuery(q => ({...q, tags}));

    const [showAdvanced, setShowAdvanced] = useState(false);

    const search = async (_: FormData) => {
        setIssues(await fetchIssues(query))
    }


    return (
        <form className="w-full px-6 p-4 flex flex-col gap-3" action={search}>
            <div className="flex items-center gap-3">
                <div className="w-1/2">
                    <LocationSearch setLocation = {setLocation} />
                </div>
                <div className="w-1/3">
                    <TagSelectionBox setTags={setTags} />
                </div>
                <button onClick={async () => setIssues(await fetchIssues(query))} className="bg-red-600">
                    Search
                </button>
                <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex flex-col items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
                >
                    <span>Archive Search</span>
                    <ArrowDown className="w-4 h-4" />
                </button>
            </div>
            {showAdvanced && (
                <div className="w-full">
                    <ArchiveSearch setIsOpen={setShowAdvanced} setSearch={setSearch} setShow={setShow} />
                </div>
            )}
        </form>
    );
}

function ArchiveSearch({ setIsOpen, setSearch, setShow } : {setSearch: (search: string) => void, setShow: (show: IssueQueryShow) => void, setIsOpen: (open: false) => void}) : JSX.Element {
    const dropdownRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div>
            <SearchInput setSearch={setSearch} />
            <IssueStatusSelect setShow={setShow} />
        </div>
    )
}


function SearchInput({ setSearch }: { setSearch: (search: string) => void }): JSX.Element {
    const [searchTerm, setSearchTerm] = useState("");
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const text = event.target.value;
        setSearchTerm(text);
        setSearch(text);
    }

    return (
        <div className="relative">
            <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                size={18}
            />
            <input
                type="text"
                value={searchTerm}
                onChange={handleChange}
                placeholder="Search issues..."
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
            />
            {searchTerm && (
                <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center bg-white text-gray-400 hover:text-gray-600 rounded-md"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
    );
}

async function fetchIssues(query: IssueQuery) : Promise<Issue[]> {
    const ordering: IssueQueryOrder = query.search === undefined ?  "NewestFirst" : "Relevance";
    const { data, error } = await client.GET("/api/issues", {
        params: {
            query : {
                search: query.search,
                show: query.show,
                locationId: query.location,
                dateAfter: query.dateAfter,
                dateBefore: query.dateBefore,
                tags: query.tags.join(',') as any,
                ordering,
            },
        },
    });
    if (data) {
        return data as Issue[];
    } else {
        console.log(error)
        return [];
    }
}