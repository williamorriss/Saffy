import { type JSX, useEffect } from "react";
import { useNavigate } from "react-router-dom"
import { useAuth } from "../hooks/AuthContext";
import { newIssueButton } from "../components/NewIssueButton";
import { IssueFeed } from "../components/IssueFeed";
import { SearchBar } from "../components/SearchBar";
import { useIssueFeed } from "../hooks/UseIssueFeed";

import { IssueFeedLegacy } from "../components/IssueFeedLegacy";

function useSession() {
    const { getSession } = useAuth();
    useEffect(() => {getSession();}, []);
}

export function Home(): JSX.Element {
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

                        <div className="flex items-center gap-4">
                            <nav className="flex items-center gap-4">

                            </nav>
                        </div>
                    </div>

                    <SearchBar feedHook={feedHook} />
                    <IssueFeed feedHook={feedHook} />
                </div>
            </div>
        </>
    );
}

export default Home