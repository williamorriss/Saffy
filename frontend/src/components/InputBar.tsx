import { type JSX} from "react";
import * as React from "react";


interface SearchBarProps {
    search: string,
    setSearch: (search: string) => void,
    onSelect?: React.ReactEventHandler<HTMLInputElement>,
    onBlur?: React.ReactEventHandler<HTMLInputElement>
}

export default function SearchBar({search, setSearch, onSelect, onBlur} : SearchBarProps) : JSX.Element {
    return (
        <form className="flex w-full gap-4 p-4">
            <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onSelect={onSelect}
                onBlur={onBlur}
                placeholder="Searching...."
                className="flex-1 w-7/8 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 bg-white text-black"
            />
            <button
                type="submit"
                className="w-1/8 px-6 py-2 !bg-blue-500 text-white rounded-lg hover:!bg-blue-600 transition-colors cursor-pointer"
            >
                {buttonText}
            </button>
        </form>
    );
}