import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format")
    .optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
