import { type JSX, useState, useEffect } from "react";
import type { Issue } from "../types/index";
import type { UseIssueFeedReturn } from "../hooks/UseIssueFeed";
import { useNavigate } from "react-router-dom";

function issuePanel({issue, navigate}: {issue: Issue, navigate: Function}): JSX.Element {
    return (
        <div key = {issue.id} className="border rounded-md p-4 mb-3 bg-white">
            <h3 className="text-base font-semibold mb-2 text-black">{issue.title}</h3>
            <p className="text-sm text-gray-600"> {issue.description} </p>
            <button onClick={() => navigate(`/issues/${issue.id}`)}/>
        </div>
    );
}

export function IssueFeed({feedHook} : {feedHook: UseIssueFeedReturn}) : JSX.Element {
    const { issues } = feedHook;
    const navigate = useNavigate();

   const displayIssues = issues.length === 0
       ? <> No issues found.</>
       : issues?.map((issue) => issuePanel({issue, navigate}));

    return (
        <>
            Issues:
            {displayIssues}
        </>
    )
}