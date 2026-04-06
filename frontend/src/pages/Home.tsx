import {type JSX, useEffect, useState} from "react";
import { useNavigate } from "react-router-dom"
import { useAuth } from "../hooks/AuthContext";
import { newIssueButton } from "../components/NewIssueButton";
import { IssueFeed } from "../components/IssueFeed";
import { InputBar } from "../components/InputBar";
import { useIssueFeed } from "../hooks/UseIssueFeed";
import { SearchableDropdown } from "../components/DropDown";
import { client } from "../App";

import type { LocationView } from "../types";

function useSession() {
    const { getSession } = useAuth();
    useEffect(() => {getSession();}, []);
}

const exampleIssueType : string[] = [
    "Delay",
    "Cancellation",
    "Broken",
    "Other",
];


export function Home(): JSX.Element {
    const [allLocations, setAllLocations] = useState<LocationView[]>([]);
    const feedHook = useIssueFeed();
    const navigate = useNavigate()
    useSession();

    useEffect(() => {
        const getLocations = async () => {
            const { data } = await client.GET("/api/locations", {});
            if (data) {
                setAllLocations(data);
            }
        }
        getLocations();
    }, []);

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
                                <SearchableDropdown 
                                  options={exampleIssueType.map((issueType, index) => ({ id: index.toString(), label: issueType, value: issueType }))}
                                  onSelect={(option) => feedHook.updateFilter({issue_type: option?.value})}
                                  placeholder="Issue Type"
                                  searchPlaceholder="Search types..."
                                />

                                <SearchableDropdown 
                                  options={allLocations.map((loc, index) => ({ id: index.toString(), label: loc.name, value: loc.description }))}
                                  onSelect={(option) => feedHook.updateFilter({location: option?.value})}
                                  placeholder="Location"
                                  searchPlaceholder="Search locations..."
                                />
                            </nav>
                        </div>
                    </div>

                    <InputBar placeholder="Searching..." buttonText="Search" inputTerm={feedHook.searchTerm} setInput={feedHook.setSearch} onSubmit={feedHook.refreshFeed}/>
                    <IssueFeed issues={feedHook.issues} />
                </div>
            </div>
        </>
    );
}

export default Home