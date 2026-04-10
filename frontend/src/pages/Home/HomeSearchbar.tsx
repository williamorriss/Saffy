import type { Tag, Location } from "../../api";
import { type JSX, useState } from "react";
import { useDefaultData } from "../../hooks/UseDefaultData.ts";
// set search Params
import LocationSearch from "../../components/LocationSearch.tsx";
import type { Feed } from "../../hooks/UseIssueFeed";
import { X, Search } from "lucide-react";

export default function HomeSearchbar({ feed: { search, setSearch } }: { feed: Feed }) {
    const { tags } = useDefaultData();
    const [location, setLocation] = useState<Location|null>(null)
    const [tagSelectionVisible, setTagSelectionVisible] = useState(false);
    const [selectedTags, setSelectedTags] = useState<Tag[]>([]);

    const addTag = (tag: Tag) => setSelectedTags([...selectedTags, tag]);
    const removeTag = (tag: Tag) => setSelectedTags(selectedTags.filter((t: Tag) => t.id !== tag.id));
    const toggleTag = (tag: Tag) => includesTag(tag) ? removeTag(tag) : addTag(tag);
    const includesTag = (tag: Tag) => selectedTags.some(t => t.id === tag.id);
    const clearTags = () => setSelectedTags([]);

    return (
        <div className="w-full px-6 p-4">
            <div className="flex flex-col gap-4" tabIndex={-1}>
                <div className="flex items-center gap-3">
                    <div className="flex-1 w-full max-w-md">
                        <SearchInput search={search} setSearch={setSearch} />
                    </div>

                    <button
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg whitespace-nowrap text-sm font-medium transition-colors"
                        onClick={() => setTagSelectionVisible(!tagSelectionVisible)}
                    >
                        Tags
                    </button>

                    <div>
                        <LocationSearch onSelect={setLocation} />
                    </div>
                </div>

                <TagDisplay selected={selectedTags} removeTag={removeTag} />

                <div>
                    <TagSelectionBox
                        tags={tags}
                        visible={tagSelectionVisible}
                        toggleTag={toggleTag}
                        clearTags={clearTags}
                        includesTag={includesTag}
                    />
                </div>
            </div>
        </div>
    );
}

function SearchInput({ search, setSearch }: { search: string, setSearch: (val: string) => void }): JSX.Element {
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

function TagDisplay({ selected, removeTag }: { selected: Tag[], removeTag: (tag: Tag) => void }): JSX.Element {
    if (selected.length === 0) return <></>;
    return (
        <div className="flex flex-wrap gap-2">
            {selected.map((tag) => (
                <button
                    key={tag.id}
                    className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-base rounded-full border border-blue-200 hover:bg-blue-100 transition-colors"
                    onClick={() => removeTag(tag)}
                >
                    {tag.name} <X size={14} />
                </button>
            ))}
        </div>
    );
}

function TagSelectionBox({ tags, visible, toggleTag, clearTags, includesTag }: TagSelectionBoxProps): JSX.Element {
    if (!visible) return <></>;
    return (
        <div className="p-4 border rounded-xl bg-gray-50 shadow-sm border-gray-200">
            <div className="flex justify-between items-center mb-4">
                <button onClick={clearTags} className="text-xs right-3 text-blue-600 hover:text-blue-800 font-medium">Clear All</button>
            </div>
            <div className="flex flex-wrap gap-2">
                {tags.map((tag) => {
                    const isSelected = includesTag(tag);
                    return (
                        <button
                            key={tag.id}
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

interface TagSelectionBoxProps {
    tags: Tag[];
    visible: boolean;
    toggleTag: (tag: Tag) => void;
    clearTags: () => void;
    includesTag: (tag: Tag) => boolean;
}