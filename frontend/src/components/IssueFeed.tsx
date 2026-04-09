import { type JSX, } from "react";
import type { Issue } from "../api";
import { useNavigate } from "react-router-dom";

type IssueFeedProp = {
    issues: Issue[]
}

function issuePanel({issue, navigate}: {issue: Issue, navigate: Function}): JSX.Element {
    return (
        <button
            onClick={() => navigate(`/issues/${issue.id}`)}
            key={issue.id}
            className="w-full min-h-[100px] px-4 py-3 mb-3 !bg-white border border-black hover:!bg-gray-100 transition-colors flex flex-col items-center justify-center"
        >
            <h2 className="text-lg font-bold mb-1 !text-black text-center">{issue.title}</h2>
            <p className="text-sm !text-gray-600 text-center">{issue.description}</p>
        </button>
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