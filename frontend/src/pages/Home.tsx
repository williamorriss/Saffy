import { type JSX, useEffect} from "react";
import { useNavigate } from "react-router-dom"
import { useAuth } from "../hooks/AuthContext";
import { newIssueButton } from "../components/NewIssueButton";
import { IssueFeed } from "../components/IssueFeed";
import { SearchBar } from "../components/SearchBar";
import { useIssueFeed } from "../hooks/UseIssueFeed";
import { SearchableDropdown } from "../components/DropDown";

import { IssueFeedLegacy } from "../components/IssueFeedLegacy";

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
const exampleLocationType : string[] = [
    "Chancelor's Building",
    "1W",
    "2W",
    "University Hall",
    "Other"
];

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
                                <SearchableDropdown 
                                  options={exampleIssueType.map((issueType, index) => ({ id: index.toString(), label: issueType, value: issueType }))}
                                  onSelect={(option) => feedHook.updateFilter({issue_type: option?.value})}
                                  placeholder="Issue Type"
                                  searchPlaceholder="Search countries..."
                                />

                                <SearchableDropdown 
                                  options={exampleLocationType.map((locationType, index) => ({ id: index.toString(), label: locationType, value: locationType }))}
                                  onSelect={(option) => feedHook.updateFilter({location: option?.value})}
                                  placeholder="Location"
                                  searchPlaceholder="Search countries..."
                                />
                            </nav>
                        </div>
                    </div>

                    <SearchBar searchTerm={feedHook.searchTerm} setSearch={feedHook.setSearch} refreshFeed={feedHook.refreshFeed} />
                    <IssueFeed issues={feedHook.issues} />
                </div>
            </div>
        </>
    );
}

export default Home