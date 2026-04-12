import { useParams } from 'react-router-dom';
import { type JSX, useState, useEffect } from "react";
import { client, type Issue, type Report, type CreateReport } from "../../api";
import { DATE_START } from "../../components/DateSlider";
import { MessageBar } from '../../components/MessageBar';

type NewReportType = {
    id: number,
    reporter: string,
    content: string,
    createdAt: string
}

const reportExampleData = [
    { id: 0, reporter: "Tim", content: "This is a test report", createdAt: "2026-3-28" },
    { id: 1, reporter: "Bob", content: "This is a test report", createdAt: "2026-3-27" },
    { id: 2, reporter: "Phil", content: "This is a test report", createdAt: "2026-3-26" },
    { id: 3, reporter: "Tim", content: "This is a test report", createdAt: "2026-3-25" },
    { id: 4, reporter: "Tim", content: "This is a test report", createdAt: "2026-3-24" },
]

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

// Bad fetch for now until we get better endpoints, one should get the single issue by id and the others should have a post reports and fetch all reports give Issue ID
const fetchIssue = async (id: string, setIssue: (issue: Issue | undefined) => void) => {
    const {data} = await client.GET("/api/issues/{id}", {
        params: {
            query: {
                search: "",
                show: "All"
            },
            path: {id: id}
        }
    })
    if (data) {
        const target: Issue[] = data.filter((issue: Issue) => issue.id == id);
        if(target.length != 0) {
            setIssue(target[0]);
        }
    }
}

export function IssuePage() {
    const [reports, setReports] = useState<CreateReport[]>([]);
    const [issue, setIssue] = useState<Issue>();
    const [message, setMessage] = useState("");
    const { issueID } = useParams();

    useEffect(() => {
        if (!issueID) return;

        fetchIssue(issueID, setIssue).then();

        // Fetch reports
    }, []);

    const submitMessage = async () => {
        // Report endpoint needed
        console.log("Submit message:", message);
        setMessage("");
    }

    const displayReports = reports.length === 0
        ? <> No reports found.</>
        : reports.map(reportPanel);

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
                    <div className="w-full items-center pb-4">
                        <MessageBar message={message} setMessage={setMessage} submit={submitMessage}/>
                    </div>
                    {displayReports}
                </div>
            </div>
        </>
    );
}

export default IssuePage;