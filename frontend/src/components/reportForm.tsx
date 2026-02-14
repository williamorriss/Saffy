import { CreateIssueSchema } from "@schemas";
import type { SubmitEvent } from "react";

export function ReportForm() {
  const post = async (form: SubmitEvent<HTMLFormElement>) => {
    form.preventDefault();
    const formData = new FormData(form.currentTarget);

    const result = CreateIssueSchema.safeParse({
      description: formData.get("description"),
      locationId: formData.get("locationId"),
    });

    if (!result.success) {
      console.error(result.error);
      alert(result.error.issues[0].message);
      return;
    }

    const response = await fetch("/api/issues", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(result.data),
    });

    if (!response.ok) {
      alert("Post failed.");
    }
  };

  return (
    <>
      <form onSubmit={post}>
        <input name="description" type="text" />
        <input name="locationId" type="number" step="any" placeholder="location_id" />
        {/*<input*/}
        {/*  name="latitude"*/}
        {/*  type="number"*/}
        {/*  step="any"*/}
        {/*  placeholder="Latitude"*/}
        {/*/>*/}
        {/*<input*/}
        {/*  name="longitude"*/}
        {/*  type="number"*/}
        {/*  step="any"*/}
        {/*  placeholder="Longitude"*/}
        {/*/>*/}
        <button type="submit">Search</button>
      </form>
    </>
  );
}