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
            <button onClick={() => navigate("/issues/new")}>New Issue</button>
            <div className="absolute left-1/32 top-1/8 w-2/3 bg-gray-800">
                <IssueFeed />
            </div>
        </>
    );
}

export default Home