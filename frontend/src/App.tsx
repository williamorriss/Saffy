import "./App.css";
// import { z } from "zod";
import { useState, useEffect, type JSX } from "react";
import { ReportForm } from "./components/reportForm.tsx";
import type { paths, components } from "./types/api.d.ts"
import createClient from "openapi-fetch";

const BACKEND_URL: string = "https://localhost:8000";
const client = createClient<paths>({ baseUrl: BACKEND_URL, credentials: "include" });


type User = components["schemas"]["User"]

function App() {

  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState<User|null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    async function getUsername(): Promise<void> {
      try {
        const { data, error } = await client.GET("/auth/session")
        if (data) {
          setUser(data);
          setLoggedIn(true);
        } else {
          alert(error);
        }
      } catch (error) {
        console.error(error);
      }
    }

    if (params.get("auth") == "true") {
      getUsername().then();
      const url = new URL(window.location.toString());
      url.searchParams.delete("auth");
      window.history.replaceState({}, "", url.pathname + url.search);
    }
  }, []);

  return loggedIn ? loggedInHomePage(user) : homePage();
}

function homePage(): JSX.Element {
  return (
    <>
      <button onClick={() => window.location.href = `/auth/login?redirect=${window.location.origin}` }>
        Login
      </button>
    </>
  );
}

function GetIssuesButton(): JSX.Element {
  return (
      <> NONE </>
  );
}
//   const [issues, setIssues] = useState<Issue[] | null>(null);
//
//   const getIssues = async () => {
//     try {
//       const { success, data, error } = z
//         .array(IssueSchema)
//         .safeParse(
//           await fetch("/api/issues").then((response) => response.json()),
//         );
//
//       if (!success) {
//         alert("Could not get issues");
//         console.error(error);
//         return;
//       }
//
//       setIssues(data);
//       console.log(data);
//     } catch (error) {
//       console.error(error);
//     }
//   };
//
//   return (
//     <>
//       <button onClick={getIssues}>Get </button>
//       {issues?.map(({ id, description }) => (
//         <p>
//           <strong>
//             IssueID: {id}, Desc: {description}
//           </strong>
//           {"\n"}
//         </p>
//       ))}
//     </>
//   );
//}

function loggedInHomePage(user: User | null): JSX.Element {
  const displayName = user?.username ?? "Unknown";
  return (
    <>
      Hello {displayName}
      <button onClick={async () => await client.DELETE("/auth/session")}>
        Logout
      </button>
      <ReportForm />
      <GetIssuesButton />
    </>
  );
}

export default App;