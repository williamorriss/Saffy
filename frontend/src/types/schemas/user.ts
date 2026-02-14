import { z } from "zod";
import type {User} from "../rust/User";

export const UserSchema = z.object({
    id: z.number().int().positive(),
    username: z.string(),
    createdAt: z.string(),
}) satisfies z.ZodType<User>;