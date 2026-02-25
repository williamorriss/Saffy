import { type JSX, useState, useEffect } from "react";
import type {Issue} from "../types/index";
import { client } from "../App";

function getInitialData(setIssues: (issues: Issue[]) => void) {
    useEffect(() => {
        const fetchIssues = async () => {
            const {data, error} = await client.GET("/api/issues");

            if (data) {
                setIssues(data);
            } else {
                alert(error);
            }
        };

        fetchIssues();
    }, []);
}

function issuePanel(issue: Issue): JSX.Element {
    return (
        <div className="border rounded-md p-4 mb-3 bg-white">
            <h3 className="text-base font-semibold mb-2">{issue.title}</h3>
            <p className="text-sm text-gray-600"> {issue.description} </p>
        </div>
    );
}

export function IssueFeed() : JSX.Element {
    const [issues, setIssues] = useState<Issue[]>([])
    getInitialData(setIssues);

    return (
        <>
            {issues?.map(issuePanel) ?? null}
        </>
    );
}