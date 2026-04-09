import {type JSX, useEffect} from "react";
import { useNavigate } from "react-router-dom"
import useAuth from "../../hooks/AuthContext.tsx";
// import { newIssueButton } from "../../components/NewIssueButton";
import { IssueFeed } from "../../components/IssueFeed";
import HomeSearchbar from "./HomeSearchbar.tsx";
import { useIssueFeed } from "../../hooks/UseIssueFeed";
import SearchableDropdown from "../../components/SearchableDropdown.tsx";
import { fromTag, fromLocation } from "../../components/SearchableDropdown.tsx";
import {useDefaultData} from "../../hooks/UseDefaultData.ts";

function useSession() {
    const { getSession } = useAuth();
    useEffect(() => {getSession();}, []);
}


export default function Home(): JSX.Element {
    const { locations, tags } = useDefaultData()
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
                            {/*<nav className="flex items-center gap-4">*/}
                            {/*    {newIssueButton(navigate)}*/}
                            {/*</nav>*/}
                        </div>

                        <div className="flex items-center gap-4">
                            <nav className="flex items-center gap-4">
                                <SearchableDropdown 
                                  options={locations.map(fromLocation)}
                                  onSelect={(option) => feedHook.updateFilter({location: option?.label})}
                                  placeholder="Location"
                                  searchPlaceholder="Search locations..."
                                />
                            </nav>
                        </div>
                    </div>

                    <HomeSearchbar search={feedHook.searchTerm} setSearch={feedHook.setSearch}/>
                    <IssueFeed issues={feedHook.issues} />
                </div>
            </div>
        </>
    );
}