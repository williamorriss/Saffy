import { type JSX, } from "react";
import type {Issue, Tag} from "../api";
import { useNavigate } from "react-router-dom";
import type {LucideIcon} from "lucide-react";
import {getTagIcon} from "../hooks/UseDefaultData.ts";

type IssueFeedProp = {
    issues: Issue[]
}


function issueTagDisplay(tag: Tag, index: number, Icon: LucideIcon): JSX.Element {
    return (
        <div
            key={index.toString()}
            className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full border border-gray-300 bg-gray-100 text-xs font-medium text-gray-700"
        >
            <Icon size={14} className="text-gray-500" />
            <span>{tag.name}</span>
        </div>
    )
}

function issuePanel({issue, navigate}: {issue: Issue, navigate: Function}): JSX.Element {
    // const location = issue.location;
    const tags = issue.tags;
    return (
        <div key={issue.id}>
            <button
                onClick={() => navigate(`/issues/${issue.id}`)}
                className="w-full min-h-[100px] px-4 py-3 mb-3 !bg-white border border-black hover:!bg-gray-100 transition-colors flex flex-col items-center justify-center"
            >
                <h2 className="text-lg font-bold mb-1 text-black! text-center">{issue.title}</h2>
                <p className="text-sm text-gray-600! text-center">{issue.description}</p>
                <div>
                    {tags.map((tag, index) => issueTagDisplay(tag, index, getTagIcon(tag.name)))}
                </div>
            </button>
        </div>
    );
}

export function IssueFeed({ issues } : IssueFeedProp) : JSX.Element {
    const navigate = useNavigate();

   const displayIssues = issues.length === 0
       ? <> No issues found.</>
       : issues?.map((issue) => issuePanel({issue, navigate}));

    return (
        <>
            {displayIssues}
        </>
    )
}