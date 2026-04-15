import {useState, useRef, useEffect, type JSX} from 'react';
import {type IssueQueryShow} from "../api";
import { RotateCcw } from "lucide-react";
import * as React from "react";


export default function IssueStatusSelect( { setShow } : { setShow: (show: IssueQueryShow) => void } ) {
    const displayOption: Record<IssueQueryShow, string> = {
        "All" : "Show All",
        "Open" : "Show Open",
        "Closed" : "Show Closed",
    };

    const options: IssueQueryShow[] = ["All", "Open", "Closed"];
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [issueShow, setIssueShow] = useState<IssueQueryShow|undefined>(undefined);


    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSet = (show: IssueQueryShow) => {
        setIssueShow(show);
        setShow(show);
        setIsOpen(false);
    }


    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIssueShow(undefined);
        setIssueShow(undefined);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {issueShow && displayOption[issueShow]}
            <button
                type="button"
                onClick={handleClear}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center bg-transparent text-gray-500 hover:text-black z-10"
            >
                <RotateCcw size={16} strokeWidth={2.5} className="shrink-0" />
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

                        {options.map((option, index) =>
                            <button key={index.toString()} onClick={() => handleSet(option)}>
                                {option}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}