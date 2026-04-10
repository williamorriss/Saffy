import {type JSX, useEffect} from "react";
import { useNavigate } from "react-router-dom"
import useAuth from "../../hooks/AuthContext.tsx";
import { IssueFeed } from "../../components/IssueFeed";
import HomeSearchbar from "./HomeSearchbar.tsx";
import useIssueFeed from "../../hooks/UseIssueFeed";
import {newIssueButton} from "../NewIssuePage/NewIssueButton.tsx";

function useSession() {
    const { getSession } = useAuth();
    useEffect(() => {getSession();}, []);
}


export default function Home(): JSX.Element {
    const feedHook = useIssueFeed();
    const navigate = useNavigate()

    useSession();

    return (
        <> 
            <div className="relative w-4/5 mx-auto">
                <div className="absolute inset-0 bg-gray-800 -z-10"></div>
                <div className="relative">
                    <div className="w-full flex justify-between px-6 pb-0 pt-4">
                        <div className="flex items-center gap-4">
                            <nav className="flex items-center gap-4">
                                {newIssueButton(navigate)}
                            </nav>
                        </div>


                    </div>

                    <HomeSearchbar feed={feedHook}/>
                    <IssueFeed issues={feedHook.issues} />
                </div>
            </div>
        </>
    );
}