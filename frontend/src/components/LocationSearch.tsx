import {useState, useRef, useEffect, type ChangeEvent, type JSX} from 'react';
import {type Location} from "../api";
import Fuse from 'fuse.js';
import useDefaultData from "../hooks/UseDefaultData.ts";
import { Search, X, ExternalLink } from "lucide-react";
import * as React from "react";


export default function LocationSearch( { setLocation } : { setLocation: (location: string | undefined) => void }) : JSX.Element {
    const { allLocations, locationMap } = useDefaultData();
    const [ selected, setSelected ] = useState<Location|null>(null); // internal tracker of which location is set
    const [search, setSearch] = useState<string|null>(null); // search term in bar
    const [isOpen, setIsOpen] = useState(false); // whether ui component is being interacted w/ or not
    const dropdownRef = useRef<HTMLDivElement>(null);

    const alphabetical: Location[] = [...allLocations].sort((a,b) => a.name.localeCompare(b.name));

    const fuse = new Fuse(allLocations, {
        keys: ["name"],
        includeScore: true,
        threshold: 1.0,
    });

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const rankedLocations: Location[] = search === null
        ? alphabetical
        : fuse
            .search(search)
            .sort((a, b) => (a.score ?? 1) - (b.score ?? 1))
            .map(result => result.item)

    const handleSelect = (loc: Location) => {
        setLocation(loc.id);
        setSelected(loc);
        setIsOpen(false);
        setSearch(loc.name);
    };

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        const text = event.target.value;
        setSearch(text); // Always update the UI input

        if (locationMap.has(text)) {
            const location: Location = locationMap.get(text)!;
            setLocation(location.id);
            setSelected(location);
        } else {
            setLocation(undefined);
            setSelected(null);
        }
    }

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelected(null);
        setLocation(undefined);
        // setIsOpen(false);
        setSearch("");
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <Search // search icon
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                size={18}
            />
            <input // search input
                type="text"
                value={search ?? ""}
                onChange={handleChange}
                onFocus={() => setIsOpen(true)}
                placeholder="Search locations..."
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
            />
            <button
                type="button"
                onClick={handleClear}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center bg-transparent text-gray-500 hover:text-black z-10"
            >
                <X size={16} strokeWidth={2.5} className="shrink-0" />
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-black shadow-lg">
                    <div
                        className="max-h-120 overflow-y-auto options-list"
                        style={{
                            scrollbarWidth: 'thin',
                            scrollbarColor: 'black white'
                        }}
                    >
                        <style>
                            {`
                                .options-list::-webkit-scrollbar {
                                    width: 8px;
                                }
                                .options-list::-webkit-scrollbar-track {
                                    background: white;
                                }
                                .options-list::-webkit-scrollbar-thumb {
                                    background: black;
                                }
                                .options-list::-webkit-scrollbar-thumb:hover {
                                    background: #333;
                                }
                            `}
                        </style>

                        {rankedLocations.length > 0
                            ? <LocationDropdown ranked={rankedLocations} selected={selected} handleSelect={handleSelect} />
                            : (
                            <div className="px-4 py-3 text-sm text-black text-center">
                                No results found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function LocationDropdown({ranked, selected, handleSelect }: {ranked: Location[], selected: Location | null, handleSelect: (loc: Location) => void}) : React.JSX.Element {
    if (selected === null) {
        return(<> {ranked.map(location => displayLocation(location, handleSelect))} </>);
    }
    const unselected = ranked.filter(location => location.id !== selected!.id);
    return (
        <>
            <div key={selected.id} className="relative group bg-green-600">
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        window.open(selected.url, '_blank');
                    }}
                    className="absolute right-3 top-3 z-10 p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Open link"
                >
                    <ExternalLink size={18} />
                </button>

                <button
                    type="button"
                    onClick={() => handleSelect(selected)}
                    className="w-full px-4 py-3 text-left border-b border-black last:border-b-0 transition-colors font-inherit text-base">

                    <div className="pr-8">
                        <strong className="block text-black"> {selected.name} </strong>
                        <p className="text-sm text-gray-600"> {selected.department} </p>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-1"> {selected.description} </p>
                    </div>
                </button>
            </div>
            {unselected.map(location => displayLocation(location, handleSelect))}
        </>
    )
}


function displayLocation(location: Location, handleSelect: (loc: Location) => void) : JSX.Element {
    return (
        <div key={location.id} className="relative group">
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    window.open(location.url, '_blank');
                }}
                className="absolute right-3 top-3 z-10 p-1 text-gray-400 hover:text-blue-600 transition-colors"
                title="Open link"
            >
                <ExternalLink size={18} />
            </button>

            <button
                type="button"
                onClick={() => handleSelect(location)}
                className="w-full px-4 py-3 text-left border-b border-black last:border-b-0 transition-colors font-inherit text-base">

                <div className="pr-8">
                    <strong className="block text-black"> {location.name} </strong>
                    <p className="text-sm text-gray-600"> {location.department} </p>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-1"> {location.description} </p>
                </div>
            </button>
        </div>
    );
}