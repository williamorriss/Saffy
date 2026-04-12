import { useState, useRef, useEffect, useMemo } from 'react';
import { type Location } from "../api";
import Fuse from 'fuse.js';
import {useDefaultData} from "../hooks/UseDefaultData.ts";

interface SearchableDropdownProps {
    onSelect: (option: Location | null) => void;
    placeholder?: string;
    value?: Location | null;
}

export default function LocationSearch({
   onSelect,
   placeholder = "Select a location",
   value = null
}: SearchableDropdownProps) {
    const { locations } = useDefaultData();
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [internalSelectedOption, setInternalSelectedOption] = useState<Location | null>(value);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Sync with external value prop
    useEffect(() => {
        setInternalSelectedOption(value);
    }, [value]);

    const rankedOptions = useMemo(() => {
        if (!searchTerm) {
            return [...locations].sort((a, b) => a.name.localeCompare(b.name));
        }

        const fuse = new Fuse(locations, {
            keys: ["name"],
            includeScore: true,
            threshold: 1.0,
        });

        return fuse
            .search(searchTerm)
            .sort((a, b) => (a.score ?? 1) - (b.score ?? 1))
            .map(result => result.item);
    }, [locations, searchTerm]);

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm("");
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (option: Location) => {
        setInternalSelectedOption(option);
        onSelect(option);
        setIsOpen(false);
        setSearchTerm("");
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent the dropdown from immediately reopening
        setInternalSelectedOption(null);
        onSelect(null);
        setIsOpen(false);
        setSearchTerm("");
    };

    return (
        <div className="relative w-64" ref={dropdownRef}>
            {/* Dropdown Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-4 py-2 text-left bg-white border border-black focus:outline-none hover:bg-gray-100 flex justify-between items-center"
            >
                <span className="text-black truncate">
                    {internalSelectedOption ? internalSelectedOption.name : placeholder}
                </span>
                <svg
                    className={`w-5 h-5 text-black transition-transform duration-200 ${isOpen ? "transform rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-black shadow-lg">
                    {/* Search Input */}
                    <div className="p-2 border-b border-black">
                        <input
                            type="text"
                            placeholder={placeholder}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 text-sm text-black bg-white border border-black focus:outline-none focus:ring-1 focus:ring-black"
                            autoFocus
                        />
                    </div>

                    {/* Options List */}
                    <div
                        className="max-h-60 overflow-y-auto options-list"
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
                        {rankedOptions.length > 0 ? (
                            rankedOptions.map((option) => (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => handleSelect(option)}
                                    className={`w-full px-4 py-2 text-left border-b border-black last:border-b-0 transition-colors ${
                                        internalSelectedOption?.id === option.id
                                            ? "bg-gray-300 text-black hover:bg-gray-400"
                                            : "bg-white text-black hover:bg-gray-200"
                                    }`}
                                >
                                    {option.name}
                                    {option.description}
                                </button>
                            ))
                        ) : (
                            <div className="px-4 py-3 text-sm text-black text-center">
                                No results found
                            </div>
                        )}
                    </div>

                    {/* Clear Selection Button */}
                    {internalSelectedOption && (
                        <div className="border-t border-black">
                            <button
                                type="button"
                                onClick={handleClear}
                                className="w-full px-4 py-2 text-left bg-white text-black hover:bg-red-50 transition-colors"
                            >
                                Clear selection
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}