import './App.css'
import type {User} from "../types"
import {useState, useEffect} from "react";


function App() {
    const [loggedIn, setLoggedIn] = useState(false);
    const [username, setUsername] = useState<string|null>(null);
    const params = new URLSearchParams(window.location.search);

    useEffect(() => {
        async function getUsername() : Promise<void> {
            try {
                const userData: User = await fetch("api/users/me", {
                    method: "GET",
                }).then((response) => response.json());
                setUsername(userData?.username as string);
                setLoggedIn(true);
            } catch (error) {
                console.error(error);
            }
        }

        if (params.get('auth') == 'true') {
            getUsername().then();
            const url = new URL(window.location.toString());
            url.searchParams.delete('auth');
            window.history.replaceState({}, '', url.pathname + url.search);
        }
    })

    if (loggedIn) {
        return (
            <>
                Hello {username ?? "Unknoqn"}
                <button onClick={() => window.location.href = "/api/auth/logout"}>Logout</button>
            </>
        )
    } else {
        return (
            <>
                <button onClick={() => window.location.href = "/api/auth/login"}>Login</button>
            </>
        )
    }
}


export default App
