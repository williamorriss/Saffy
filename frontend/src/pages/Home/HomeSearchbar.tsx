import styles from "./Home.module.css"
import type {Tag} from "../../api";
import {type JSX, useRef} from "react";
import {useDefaultData} from "../../hooks/UseDefaultData.ts";
import * as React from "react";
import SearchBar from "../../components/SearchBar.tsx";

interface HomeSearchbarProps {
    search: string;
    setSearch: (search: string) => void;
}

export default function HomeSearchbar({search, setSearch} : HomeSearchbarProps) {
    const { tags } = useDefaultData();
    const [tagSelectionVisible, setTagSelectionVisible ] = React.useState(false);
    const [selectedTags, setSelectedTags ] = React.useState<Tag[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);

    const addTag = (tag: Tag) =>
        setSelectedTags([...selectedTags, tag]);
    const removeTag = (tag: Tag) =>
        setSelectedTags(selectedTags.filter((t: Tag) => t.id !== tag.id));
    const toggleTag = (tag: Tag) =>
        includesTag(tag) ? removeTag(tag) : addTag(tag);

    const includesTag = (tag: Tag) => selectedTags.includes(tag);

    const clearTags = () => setSelectedTags([]);


    const handleBlur = (e: React.FocusEvent) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setTagSelectionVisible(false);
        }
    };

    const handleFocus = () => {
        setTagSelectionVisible(true);
    };

    return (
        <div ref={containerRef}
             onBlur={handleBlur}
             onFocus={handleFocus}
             tabIndex={-1}
        >
            <SearchBar search={search} setSearch={setSearch} />
            <TagDisplay selected={selectedTags} removeTag={removeTag} />
            <TagSelectionBox tags={tags} visible={tagSelectionVisible} toggleTag={toggleTag} clearTags={clearTags} includesTag={includesTag} />
        </div>
    )
}



function TagDisplay( {selected, removeTag}: {selected: Tag[], removeTag: (tag: Tag) => void}) : JSX.Element {
    const displayTag = (tag: Tag) => {
        return (
            <button key={tag.id} className={styles.chosenTag}  onClick={() => removeTag(tag)}> {tag.name} </button>
        )
    }
    return (
        <div className={styles.tagDisplayBox}>{selected.map(displayTag)}</div>
    )
}

interface TagSelectionBoxProps {
    tags: Tag[];
    visible: boolean;
    toggleTag: (tag: Tag) => void;
    clearTags: () => void;
    includesTag: (tag: Tag) => boolean;
}
function TagSelectionBox({ tags, visible, toggleTag, clearTags, includesTag }: TagSelectionBoxProps): JSX.Element {
    const showTag = (tag: Tag) => {
        if (includesTag(tag)) {
            return(
                <button key={tag.id} className={styles.selectedTag} onClick={() => toggleTag(tag)}>{tag.name}</button>
            );
        } else {
            return (
                <button key={tag.id} className={styles.unselectedTag} onClick={() => toggleTag(tag)}> {tag.name}</button>
            );
        }
    };

    return (
        <>{visible && <div>{tags.map(showTag)} <button onClick={clearTags}>clear</button></div>}</>
    );
}