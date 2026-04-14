import { useParams } from 'react-router-dom';
import { type JSX, useState, useEffect } from "react";
import { client, type Issue, type Report, type CreateReport } from "../../api";

type NewReportType = {
    id: number,
    reporter: string,
    content: string,
    createdAt: string
}

function reportPanel(report: NewReportType): JSX.Element {
    return (
        <div key = {report.id} className="w-full flex justify-start flex-col border rounded-md p-4 mb-3 bg-white items-start">
            <div className="flex justify-start items-center">
                <p className="font-semibold text-black mr-2">{report.reporter}</p>
                <p className="text-gray-600">({report.createdAt})</p>
                <p className="font-semibold text-black">:</p>
            </div>
            <p className="text-sm text-gray-600"> {report.content} </p>
        </div>
    );

}

async function fetchIssue(id: string, setIssue: (issue: Issue) => void) : Promise<void> {
    const {data} = await client.GET("/api/issues/{id}", {
        params: {
            path: {id: id}
        }
    })
    if (data) {
        setIssue(data);
    }
}

async function fetchReports(id: string, setReports: (reports: Report[]) => void) : Promise<void> {
    const {data} = await client.GET("/api/issues/{id}/reports", {
        params: {
            path: {id: id}
        }
    })
    if (data) {
        setReports(data);
    }
}

export function IssuePage() {
    const [reports, setReports] = useState<Report[]>([]);
    const [issue, setIssue] = useState<Issue>();
    const [message, setMessage] = useState("");
    const { issueID } = useParams();

    useEffect(() => {
        if (issueID) {
            fetchIssue(issueID, setIssue).then();
        } else {
            console.error("IssueID undef");
        }
    }, [issueID]);

    useEffect(() => {
        if (issueID) {
            fetchReports(issueID, setReports).then();
        } else {
            console.error("IssueID undef");
        }
    }, []);

    // const submitMessage = async () => {
    //     // Report endpoint needed
    //     console.log("Submit message:", message);
    //     setMessage("");
    // }

    const displayReports = reports.length === 0
        ? <> No reports found.</>
        : reports.map(report => <> report.id </>);

    return (
        <>
            <div className="relative w-4/5 mx-auto pb-6">
                <div className="absolute inset-0 bg-gray-800 -z-10 rounded-md"></div>

                <div className="relative flex flex-col items-center p-6 gap-2 w-3/4 mx-auto">
                    <div className="w-full flex justify-start px-6 gap-4">
                        <p className="text-sm text-gray-600">Issue ID:</p>
                        <p className="text-sm text-gray-600">{issueID}</p>
                    </div>

                    <div className="w-full flex flex-col items-start px-6 pb-4 pt-4 bg-white rounded-md">
                        <h3 className="text-lg font-bold !text-black">{issue?.title}:</h3>
                        <p className="text-sm !text-gray-600">{issue?.description}</p>
                    </div>
                </div>

                <div className="relative flex flex-col items-start p-6 gap-2 w-3/4 mx-auto bg-gray-300 rounded-md pb-4 max-h-screen overflow-y-auto">
                    <div className="w-full flex justify-between gap-4 items-baseline">
                        <p className="text-lg font-bold !text-black">Reports:</p>
                        <p className="text-sm text-gray-600 italic opacity-50">{reports.length} found</p>
                    </div>

                    {displayReports}
                </div>
            </div>
        </>
    );
}

export default IssuePage;