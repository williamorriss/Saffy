import {type JSX, useEffect, useState, useRef} from "react";
import useDefaultData , {getTagIcon} from "../hooks/UseDefaultData.ts";
import Fuse from 'fuse.js';
import {type LucideIcon, Search, X} from "lucide-react";
import * as React from "react";

export default function TagSelectionBox({ setTags }: { setTags: (tags: string[]) => void}): JSX.Element {
    const { allTags } = useDefaultData();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const [search, setSearch] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [selected, setSelected] = useState<string[]>([]);

    const alphabetical = [...allTags].sort((a, b) => a.localeCompare(b));


    const addTag = (tag: string) => {
        const next = [...selected, tag];
        setSelected(next);
        setTags(next);
    };
    const removeTag = (tag: string) => {
        const next = selected.filter(t => t !== tag);
        setSelected(next);
        setTags(next);
    };
    const includesTag = (tag: string) => selected.some(t => t === tag);
    const clearTags = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelected([]);
        setTags([]);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearch("");
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Focus search input when dropdown opens
    useEffect(() => {
        if (isOpen) searchRef.current?.focus();
    }, [isOpen]);

    const fuse = new Fuse(allTags, {
        keys: ["name"],
        includeScore: true,
        threshold: 1.0,
    });

    const rankedTags: string[] = search === ""
        ? alphabetical
        : fuse
            .search(search)
            .sort((a, b) => (a.score ?? 1) - (b.score ?? 1))
            .map(result => result.item);

    const handleSelect = (tag: string) => {
        if (includesTag(tag)) {
            removeTag(tag);
        } else {
            addTag(tag);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger box — shows chips or placeholder */}
            <div
                className="min-h-10 w-full flex flex-wrap items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg bg-white cursor-text focus-within:ring-2 focus-within:ring-blue-500"
                onClick={() => setIsOpen(true)}
            >
                {selected.length === 0 && (
                    <span className="text-gray-400 text-sm select-none">Select tags...</span>
                )}
                {selected.map((tag, index) => displayTagWidget(tag, index, removeTag, getTagIcon(tag)))}
                {selected.length > 0 && (
                    <button
                        type="button"
                        onClick={clearTags}
                        className="ml-auto h-6 w-6 flex items-center justify-center text-gray-400 hover:text-black"
                    >
                        <X size={14} strokeWidth={2.5} />
                    </button>
                )}
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-black shadow-lg">
                    {/* Search input inside dropdown */}
                    <div className="relative border-b border-gray-200 px-2 py-2">
                        <Search
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                            size={16}
                        />
                        <input
                            ref={searchRef}
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search tags..."
                            className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black bg-white"
                        />
                    </div>

                    {/* string list */}
                    <div
                        className="max-h-60 overflow-y-auto options-list"
                        style={{ scrollbarWidth: 'thin', scrollbarColor: 'black white' }}
                    >
                        <style>{`
                            .options-list::-webkit-scrollbar { width: 8px; }
                            .options-list::-webkit-scrollbar-track { background: white; }
                            .options-list::-webkit-scrollbar-thumb { background: black; }
                            .options-list::-webkit-scrollbar-thumb:hover { background: #333; }
                        `}</style>

                        {rankedTags.length > 0
                            ? rankedTags.map((tag, index) =>
                                displayTag(tag, index, handleSelect, getTagIcon(tag), includesTag(tag))
                            )
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


function displayTagWidget(tag: string, index: number, removeTag: (tag: string) => void, Icon: LucideIcon ) {
    return (
        <div
            key={index.toString()}
            className="flex items-center px-2 py-0.5 text-sm text-gray-700 bg-gray-200 rounded-full"
        >
            {tag}
            <Icon size={18} />
            <button type="button"
                className="ml-1.5 font-bold text-gray-500 hover:text-black focus:outline-none text-capitalize text-lg"
                onClick={(e) => {
                    e.stopPropagation();
                    removeTag(tag);
                }}
            >
                <X size={18} strokeWidth={2.5} />

            </button>
        </div>
    );


}

function displayTag(tag: string, index: number, onSelect: (tag: string) => void, Icon: LucideIcon, isSelected: boolean) {
    return (
        <button type="button"
            key={index.toString()}
            onClick={() => onSelect(tag)}
            className={`${isSelected ? "bg-green-600" : "hover:bg-gray-100"} w-full text-left px-4 py-2 text-sm text-black border-b border-gray-100 last:border-0 transition-colors`}
        >
            <Icon size={20} />
            {tag}
        </button>
    );
}