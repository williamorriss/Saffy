import type { components, paths } from "./types";
import createClient from "openapi-fetch";

export type User = components["schemas"]["UserSchema"];
export type Issue = components["schemas"]["IssueSchema"];
export type IssueQueryShow = components["schemas"]["IssueQueryShow"];
export type CreateIssue = components["schemas"]["CreateIssue"];
export type Report = components["schemas"]["ReportSchema"];
export type Location = components["schemas"]["LocationSchema"];
export type Tag = components["schemas"]["TagSchema"];



// export const BACKEND_URL: string = "https://localhost:8000";
export const BACKEND_URL: string = "http://localhost:8000";
export const client
    = createClient<paths>({ baseUrl: BACKEND_URL, credentials: "include" });