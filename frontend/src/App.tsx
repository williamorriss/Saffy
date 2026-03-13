import "./App.css";
import { Routes, Route, Link } from 'react-router-dom';
import type { paths } from "./types/api.d.ts";
import createClient from "openapi-fetch";
import { Home } from "./pages/Home";
import { NewIssue } from "./pages/NewIssue";
import {type JSX} from "react";
import { useAuth} from "./AuthContext";

export const BACKEND_URL: string = "https://localhost:8000";
export const client
    = createClient<paths>({ baseUrl: BACKEND_URL, credentials: "include" });

function loginLogoutLink() : JSX.Element {
  const { isLoggedIn, login, logout} = useAuth();
  console.log(isLoggedIn());

  if (!isLoggedIn()) {
    return <button onClick={login}> Login </button>
  } else {
    return <button onClick={logout}>Logout</button>
  }
}

function App() {
  return (
      <>
        <nav>
          <Link to="/">Home</Link>
            {loginLogoutLink()}
        </nav>

        <Routes>
          <Route path="/" element={<Home />} />
            <Route path="/new-issue" element={<NewIssue />} />
        </Routes>
      </>
  );
}


export default App;