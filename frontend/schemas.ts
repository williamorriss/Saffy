import { z } from "zod";

/*
This is a file to store commonly used schemas for runtime validation,
(mostly for user input/ database retrieval)
 */

export const IssueForm = z.object({
  description: z.string(),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  level: z.coerce.number().nonnegative(),
});

export const IssueResponse = z.object({
  id: z.number().positive(),
  issue_description: z.string(),
  location_description: z.string(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  level: z.number().nonnegative(),
  opened_at: z.string(),
  closed_at: z.string().nullable(),
});