import { z } from "zod";
export const CreateReportSchema = z.object({
    description: z.string().nullable(),
    locationId: z.coerce.number().int().positive(),
});