import { type JSX, useEffect} from "react"
import { useNavigate } from 'react-router-dom';
import { IssueFeed } from "../components/IssueFeed"
import { useAuth } from "../AuthContext";


function useSession() {
    const { getSession } = useAuth();
    useEffect(() => {
        const { error } = getSession();
        if (error) {
            alert(error.message);
        }
    }, []);
}

export function Home(): JSX.Element {
    const navigate = useNavigate()
    useSession();
    return (
        <>
            <button onClick={() => navigate("/new-issue")}>New Issue</button>
            <IssueFeed />
        </>
    );
}

export default Home