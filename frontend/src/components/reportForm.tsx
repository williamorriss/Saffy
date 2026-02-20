// import { CreateIssueSchema } from "@schemas";
// import type { SubmitEvent } from "react";
import { type JSX } from "react";


export function ReportForm() : JSX.Element {
  // const post = async (form: SubmitbEvent<HTMLFormElement>) => {
  //   form.preventDefault();
  //   const formData = new FormData(form.currentTarget);
  //
  //   const result = CreateIssueSchema.safeParse({
  //     description: formData.get("description"),
  //     locationId: formData.get("locationId"),
  //   });
  //
  //   if (!result.success) {
  //     console.error(result.error);
  //     alert(result.error.issues[0].message);
  //     return;
  //   }
  //
  //   const response = await fetch("/api/issues", {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //     },
  //     body: JSON.stringify(result.data),
  //   });
  //
  //   if (!response.ok) {
  //     alert("Post failed.");
  //   }
  // };

  return (<></>);
}