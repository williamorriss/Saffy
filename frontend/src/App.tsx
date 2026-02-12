import "./App.css";
import type { Username } from "../types";
import { z } from "zod";
import { IssueResponse } from "../schemas.ts";
import { useState, useEffect, type JSX } from "react";
import { ReportForm } from "./components/reportForm.tsx";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const params = new URLSearchParams(window.location.search);

  useEffect(() => {
    async function getUsername(): Promise<void> {
      try {
        const userData: Username = await fetch("api/users/me", {
          method: "GET",
        }).then((response) => response.json());

        setUsername(userData?.username as string);
        setLoggedIn(true);
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
  });

  return loggedIn ? loggedInHomePage(username) : homePage();
}

function homePage(): JSX.Element {
  return (
    <>
      <button onClick={() => (window.location.href = "/auth/login")}>
        Login
      </button>
    </>
  );
}

function GetIssuesButton(): JSX.Element {
  type Issue = z.infer<typeof IssueResponse>;
  const [issues, setIssues] = useState<Issue[] | null>(null);

  const getIssues = async () => {
    try {
      const { success, data, error } = z
        .array(IssueResponse)
        .safeParse(
          await fetch("/api/issues").then((response) => response.json()),
        );

      if (!success) {
        alert("Could not get issues");
        console.error(error);
        return;
      }

      setIssues(data);
      console.log(data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <button onClick={getIssues}>Get </button>
      {issues?.map(({ id, issue_description }) => (
        <p>
          <strong>
            IssueID: {id}, Desc: {issue_description}
          </strong>
          {"\n"}
        </p>
      ))}
    </>
  );
}

function loggedInHomePage(username: string | null): JSX.Element {
  const displayName = username ?? "Unknown";
  return (
    <>
      Hello {displayName}
      <button onClick={() => (window.location.href = "/auth/logout")}>
        Logout
      </button>
      <ReportForm />
      <GetIssuesButton />
    </>
  );
}

export default App;