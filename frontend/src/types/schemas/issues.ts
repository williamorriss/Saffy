import { z } from "zod";
import type {Issue} from "../rust/Issue"
import {LocationSchema} from "./location";
import type {CreateIssue} from "../rust/CreateIssue"

export const IssueSchema = z.object({
    id: z.number().int().positive(),
    description: z.string().nullable(),
    openedAt: z.string(),
    closedAt: z.string().nullable(),
    location: LocationSchema,
}) satisfies z.ZodType<Issue>;

export const CreateIssueSchema = z.object({
    description: z.string().nullable(),
    locationId: z.coerce.number().int().positive(),
}) satisfies z.ZodType<CreateIssue>;