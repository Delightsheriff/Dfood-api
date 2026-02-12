import { z } from "zod";

export const addCardSchema = z.object({
  reference: z.string().min(1), // Paystack transaction reference
});

export type AddCardInput = z.infer<typeof addCardSchema>;
