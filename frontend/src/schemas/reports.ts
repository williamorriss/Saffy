import { z } from "zod";
import type { createIssue } from "./types";
export const CreateIssueSchema = z.object({
    title: z.string(),
    description: z.string().nullable(),
    locationId: z.coerce.number().int().positive(),
}) satisfies createIssue;