import {type JSX, useEffect, useState} from "react";
import { useNavigate } from "react-router-dom"
import useAuth from "../../hooks/AuthContext.tsx";
import HomeSearchbar from "./HomeSearchbar.tsx";
import { newIssueButton } from "../NewIssuePage/NewIssueButton.tsx";
import {client, type Issue} from "../../api";
import {IssueFeed} from "../../components/IssueFeed.tsx";

function useSession() {
    const { getSession } = useAuth();
    useEffect(() => {getSession();}, []);
}


export default function Home(): JSX.Element {
    const [issues, setIssues] = useState<Issue[]>([]);
    const navigate = useNavigate()

    useSession();
    useEffect(() => {
        const fetchIssues = async () => {
            const { data } = await client.GET("/api/issues")
            if (data) {
                setIssues(data)
            } else {
                setIssues([]);
            }
        }
        fetchIssues().then();
    }, []);

    return (
        <> 
            <div className="relative w-4/5 mx-auto">
                <div className="absolute inset-0 bg-gray-800 -z-10"></div>
                <div className="relative">
                    <div className="w-full flex justify-between px-6 pb-0 pt-4">
                        <div className="flex items-center gap-4">
                            <nav className="flex items-center gap-4">
                                { newIssueButton(navigate) }
                            </nav>
                        </div>


                    </div>

                    <HomeSearchbar setIssues={setIssues}/>
                    <IssueFeed issues={issues} />
                </div>
            </div>
        </>
    );
}