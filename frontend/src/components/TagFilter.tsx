import type {IssueQuery, Tag} from "../api";
import { type JSX } from "react";
import { useDefaultData } from "../hooks/UseDefaultData.ts";
import { X } from "lucide-react";

interface TagSelectionBoxProps {
    visible: boolean;
    query: IssueQuery;
    setQuery: (query: IssueQuery) => void;
}

export function TagDisplay({ query, setQuery }: { query: IssueQuery, setQuery: (query: IssueQuery) => void}): JSX.Element {
    const tags = query.tags;
    const removeTag = (tag: Tag) => {
        setQuery({...query, tags: tags.filter((t: Tag) => t.id !== tag.id)});
    }

    if (tags.length === 0) return <></>;
    return (
        <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
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

export function TagSelectionBox({ visible, query, setQuery }: TagSelectionBoxProps): JSX.Element {
    const { tags } = useDefaultData();
    const queryTags = query.tags;
    const setTags = (newTags: Tag[])=>  setQuery({...query, tags: newTags })
    const addTag = (tag: Tag) => setTags([...queryTags, tag]);
    const removeTag = (tag: Tag) => setTags(queryTags.filter((t: Tag) => t.id !== tag.id));
    const toggleTag = (tag: Tag) => includesTag(tag) ? removeTag(tag) : addTag(tag);
    const includesTag = (tag: Tag) => queryTags.some(t => t.id === tag.id);
    const clearTags = () => setTags([]);

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