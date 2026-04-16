import { useParams } from 'react-router-dom';
import { type JSX, useState, useEffect } from "react";
import {client, type Issue, type Report, type CreateReport, type CreateIssue} from "../../api";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import LocationSearch from "../../components/LocationSearch.tsx";
import {zodResolver} from "@hookform/resolvers/zod";

const CreateReportSchema = z.object({
    description: z.string().min(1),
}) satisfies z.ZodType<CreateReport>;

type CreateReportForm = z.infer<typeof CreateReportSchema>;


function reportPanel(report: Report, index: number): JSX.Element {
    return (
        <div key = {index.toString()} className="w-full flex justify-start flex-col border rounded-md p-4 mb-3 bg-white items-start">
            <div className="flex justify-start items-center">
                <p className="font-semibold text-black mr-2">{report.description}</p>
                <p className="text-gray-600">({report.createdAt})</p>
                <p className="font-semibold text-black">:</p>
            </div>
            <p className="text-sm text-gray-600"> {report.closedAt} </p>
        </div>
    );
}

const defaultValues : CreateReportForm = {
    description: ""
}




async function fetchIssue(issueID: string, setIssue: (issue: Issue) => void) : Promise<void> {
    const {data} = await client.GET("/api/issues/{id}", {
        params: {
            path: {id: issueID}
        }
    })
    if (data) {
        setIssue(data);
    }
}

async function fetchReports(issueID: string, setReports: (reports: Report[]) => void) : Promise<void> {
    const {data} = await client.GET("/api/issues/{id}/reports", {
        params: {
            path: {id: issueID}
        }
    })
    if (data) {
        setReports(data);
    }
}

export function IssuePage() {
    const { issueID } = useParams();
    const [reports, setReports] = useState<Report[]>([]);
    const [issue, setIssue] = useState<Issue>();

    const { handleSubmit, register, formState: { errors } } = useForm<CreateReportForm>({
        resolver: zodResolver(CreateReportSchema),
        defaultValues,
    });


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

    const submitReport = async (report: CreateReportForm) => {
        const { data } = await client.POST("/api/issues/{id}/reports", {
            params: {
                path: {id: issueID!},
            },
            body: {
                description: report.description,
            }
        });
        if (data) {
            setReports([...reports, data as Report]);
        }
    }

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

                    <form onSubmit={handleSubmit(submitReport)}>
                        <input {...register("description")} placeholder="Report" className="w-full p-2 rounded bg-white text-black text-xl font-bold"/>
                        <button type="submit">Submit</button>
                    </form>
                    {errors.description && (
                        <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
                    )}

                    {reports.length === 0
                        ? <> No reports found.</>
                        : reports.map(reportPanel)}
                </div>

            </div>
        </>
    );
}

export default IssuePage;