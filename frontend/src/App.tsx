import "./App.css";
import { Routes, Route, Link } from 'react-router-dom';
import type { paths } from "./types/api.d.ts";
import createClient from "openapi-fetch";
import { Home } from "./pages/Home";
import { NewIssue } from "./pages/NewIssue";
import {type JSX} from "react";
import { useAuth } from "./AuthContext";
import { IssuePage } from "./pages/IssuePage";

// export const BACKEND_URL: string = "https://localhost:8000";
export const BACKEND_URL: string = "http://localhost:8000";
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
        <div className="fixed top-0 left-0 right-0 h-16 bg-gray-800 flex items-center justify-between px-6 z-50">
          <div className="flex items-center gap-4">
            <nav className="flex items-center gap-4">
              <Link to="/" className="text-white hover:text-blue-400 transition-colors"> Home </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <nav className="flex items-center gap-4">
              {loginLogoutLink()}
            </nav>
          </div>
        </div>
        

        <div className="fixed top-0 left-0 w-full h-full pt-24 overflow-auto">
          <Routes>
            <Route path="/" element={<Home />} />
              <Route path="/issues/new" element={<NewIssue />} />
              <Route path="/issues/:issueID" element={<IssuePage/>}/>
          </Routes>
        </div>
      </>
  );
}


export default App;