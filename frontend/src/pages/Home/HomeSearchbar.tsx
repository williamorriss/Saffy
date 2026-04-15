import {type IssueQuery, type Issue, client, type IssueQueryOrder, type Tag} from "../../api";
import {type JSX , useState} from "react";
// set search Params
import LocationSearch from "../../components/LocationSearch.tsx";
import { X, Search } from "lucide-react";
import { TagSelectionBox } from "../../components/TagFilter.tsx";

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

    const search = async (_: FormData) => {
        setIssues(await fetchIssues(query))
    }

    const setTags = (tags: Tag[]) => setQuery({...query, tags})

    return (
        <form className="w-full px-6 p-4 flex items-center gap-3" action={search} >
            <div className="w-1/2">
                <LocationSearch setLocationID={(locID: string | undefined) => {setQuery({...query, location: locID})}} />
            </div>
            <div className="w-1/3">
                <TagSelectionBox setSelected={setTags} />
            </div>

            <div className="flex-1/4 max-w-md">
                <SearchInput query={query} setQuery={setQuery} />
            </div>
        </form>
    );
}

function SearchInput({ query, setQuery }: { query: IssueQuery, setQuery: (query: IssueQuery) => void }): JSX.Element {
    const search = query.search;
    const setSearch = (value: string) => {setQuery({...query, search: value});};
    return (
        <div className="relative">
            <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                size={18}
            />
            <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search issues..."
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
            />
            {search && (
                <button
                    type="button"
                    onClick={() => setSearch("")}
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
                location_id: query.location,
                date_after: query.dateAfter,
                date_before: query.dateBefore,
                tags: query.tags.map(tag => tag.name),
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