import { IssueForm } from "../../schemas.ts";
import type { SubmitEvent } from "react";

/**
 * Component to take input to create a new issue
 * @constructor
 */
export function ReportForm() {
  const post = async (form: SubmitEvent<HTMLFormElement>) => {
    form.preventDefault(); // prevents parameters being passed in url
    const formData = new FormData(form.currentTarget);

    const result = IssueForm.safeParse({
      latitude: formData.get("latitude"), // This is just for test, better solution for location is needed in the future
      longitude: formData.get("longitude"),
      level: formData.get("level"),
      description: formData.get("description"),
    });

    if (!result.success) {
      alert(result.error.issues[0].message); // Will implement better error handling later
      return;
    }

    const response = await fetch("/api/issues", {
      method: "POST",
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
        <input
          name="latitude"
          type="number"
          step="any"
          placeholder="Latitude"
        />
        <input
          name="longitude"
          type="number"
          step="any"
          placeholder="Longitude"
        />
        <button type="submit">Search</button>
      </form>
    </>
  );
}