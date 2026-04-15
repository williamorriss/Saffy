import { type JSX, } from "react";
import type {Issue, Tag} from "../api";
import { useNavigate } from "react-router-dom";

type IssueFeedProp = {
    issues: Issue[]
}


function issueTagDisplay( tag: Tag, index: number) : JSX.Element {
    return (
        <div className="font-black text-black" key={index.toString()}>
            {tag.name}
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
                <h2 className="text-lg font-bold mb-1 !text-black text-center">{issue.title}</h2>
                <p className="text-sm !text-gray-600 text-center">{issue.description}</p>
                <div>
                    {tags.map(issueTagDisplay)}
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