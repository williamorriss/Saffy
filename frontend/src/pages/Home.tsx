import { type JSX, useEffect} from "react"
import { useNavigate } from "react-router-dom";
import { IssueFeed } from "../components/IssueFeed"
import { useAuth } from "../AuthContext";


function useSession() {
    const { getSession } = useAuth();
    useEffect(() => {getSession();}, []);
}

export function Home(): JSX.Element {
    const navigate = useNavigate()
    useSession();
    return (
        <>
            <div className="relative left-1/2 w-4/5 bg-gray-800 -translate-x-1/2">
                <button onClick={() => navigate("/issues/new")}>New Issue</button>
                <IssueFeed />
            </div>
        </>
    );
}

export default Home