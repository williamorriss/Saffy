import { useParams } from 'react-router-dom';
import { type JSX, useState, useEffect } from "react";
import type { Report } from "../types/index";
import { client } from "../App";


export function IssuePage() {
    const [reports, setReports] = useState<Report[]>([]);
    const { issueID } = useParams();
    console.log(issueID);

    useEffect(() => {
        if (!issueID) return;

        const fetch = async () => {
            const {data} = await client.GET("/api/issues/{id}", {
                params:{
                    path: {id: issueID}
                }
            });
            if (data) {
                setReports(data);
            }
        }
        fetch();
    }, []);

    const displayReports = reports.length === 0
        ? <> No reports found.</>
        : reports.map(reportPanel);

    return (<>
        <div>Issue ID: {issueID}</div>
        {displayReports}
    </>);
}

function reportPanel(report: Report): JSX.Element {
    return (
        <div key = {report.id} className="border rounded-md p-4 mb-3 bg-white">
            <p className="text-sm text-gray-600"> {report.description} </p>
        </div>
    );

}



export default IssuePage;