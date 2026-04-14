import type { Tag } from "../api";
import { type JSX, useEffect, useState, useRef, useMemo } from "react";
import { useDefaultData } from "../hooks/UseDefaultData.ts";
import Fuse from 'fuse.js';
import { X } from "lucide-react";

interface TagSelectionBoxProps {
    visible: boolean;
    tags: Tag[];
    setTags: (tags: Tag[]) => void;
}

export function TagDisplay({ tags, setTags }: { tags: Tag[], setTags: (tags: Tag[]) => void}): JSX.Element {
    const removeTag = (tag: Tag) => {
        setTags(tags.filter((t: Tag) => t.name !== tag.name));
    }

    if (tags.length === 0) return <></>;
    return (
        <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
                <button 
                    type="button"
                    key={index.toString()}
                    className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-base rounded-full border border-blue-200 hover:bg-blue-100 transition-colors"
                    onClick={() => removeTag(tag)}
                >
                    {tag.name} <X size={14} />
                </button>
            ))}
        </div>
    );
}

export function TagSelectionBox({ visible, tags, setTags }: TagSelectionBoxProps): JSX.Element {
    const { allTags } = useDefaultData();
    const addTag = (tag: Tag) => setTags([...tags, tag]);
    const removeTag = (tag: Tag) => setTags(tags.filter((t: Tag) => t.name !== tag.name));
    const toggleTag = (tag: Tag) => includesTag(tag) ? removeTag(tag) : addTag(tag);
    const includesTag = (tag: Tag) => tags.some(t => t.name === tag.name);
    const clearTags = () => setTags([]);

    if (!visible) return <></>;
    return (
        <div className="p-4 border rounded-xl bg-gray-50 shadow-sm border-gray-200">
            <div className="flex justify-between items-center mb-4">
                <button type="button" onClick={clearTags} className="text-xs right-3 text-blue-600 hover:text-blue-800 font-medium">Clear All</button>
            </div>
            <div className="flex flex-wrap gap-2">
                {allTags.map((tag, index) => {
                    const isSelected = includesTag(tag);
                    return (
                        <button
                            type="button"
                            key={index.toString()}
                            className={`px-4 py-1.5 rounded-full text-sm border transition-all ${
                                isSelected
                                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                    : "bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                            }`}
                            onClick={() => toggleTag(tag)}
                        >
                            {tag.name}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

interface SearchableDropdownProps {
    onSelect: (tagName:string | undefined) => void
    placeholder?: string;
    value?: Tag | null;
    options?: Tag[]
}

export function TagSearch({
   onSelect,
   placeholder = "Add tags",
   value = null,
   options = []
}: SearchableDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [internalSelectedOption, setInternalSelectedOption] = useState<Tag | null>(value);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Sync with external value prop
    useEffect(() => {
        setInternalSelectedOption(value);
    }, [value]);

    const rankedOptions = useMemo(() => {
        if (!searchTerm) {
            return [...options].sort((a, b) => a.name.localeCompare(b.name));
        }

        const fuse = new Fuse(options, {
            keys: ["name"],
            includeScore: true,
            threshold: 1.0,
        });

        return fuse
            .search(searchTerm)
            .sort((a, b) => (a.score ?? 1) - (b.score ?? 1))
            .map(result => result.item);
    }, [options, searchTerm]);

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

    const handleSelect = (option: Tag) => {
        setInternalSelectedOption(option);
        onSelect(option.name);
        setIsOpen(false);
        setSearchTerm("");
        setInternalSelectedOption(null);
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent the dropdown from immediately reopening
        setInternalSelectedOption(null);
        onSelect(undefined);
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
                                    key={option.name}
                                    type="button"
                                    onClick={() => handleSelect(option)}
                                    className={`w-full px-4 py-2 text-left border-b border-black last:border-b-0 transition-colors ${
                                        internalSelectedOption?.name === option.name
                                            ? "bg-gray-300 text-black hover:bg-gray-400"
                                            : "bg-white text-black hover:bg-gray-200"
                                    }`}
                                >
                                    {option.name}
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