import { z } from "zod";
import type {Location} from "../rust/Location";
export const LocationSchema = z.object({
    id: z.number().int().positive(),
    description: z.string().nullable(),
    longitude: z.number(),
    latitude: z.number(),
    level: z.number().int().positive(),
}) satisfies z.ZodType<Location>;