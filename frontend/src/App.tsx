import "./App.css";
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import type { paths } from "./types/api.d.ts";
import createClient from "openapi-fetch";
import { Home } from "./pages/Home";
import {type JSX} from "react";
import { useAuth} from "./AuthContext";

export const BACKEND_URL: string = "https://localhost:8000";
export const client = createClient<paths>({ baseUrl: BACKEND_URL, credentials: "include" });

function loginLogoutLink() : JSX.Element {
  const { isLoggedIn, deleteSession } = useAuth();

  if (isLoggedIn()) {
    return <a> href=`/auth/login?redirect=${window.location.origin}` </a>
  } else {
    return <button onClick={deleteSession}>Logout</button>
  }
}

function App() {
  return (
      <>
        <nav>
          <Link to="/">Home</Link> |{" "}
            {loginLogoutLink()}
        </nav>

        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </>
  );
}


export default App;