import { type JSX, useEffect} from "react"
import { IssueFeed } from "../components/IssueFeed"
import { useAuth } from "../AuthContext";

function useSession() {
    const { retrieveSession } = useAuth();
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get("auth") == "true") {
            try {
                retrieveSession();
                const url = new URL(window.location.toString());
                url.searchParams.delete("auth");
                window.history.replaceState({}, "", url.pathname + url.search);
            } catch (error) {
                alert(error);
            }
        }
    }, []);
}

export function Home(): JSX.Element {
    useSession();
    return (
        <>
            <IssueFeed />
        </>
    );
}

export default Home