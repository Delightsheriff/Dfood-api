import { z } from "zod";

export const createFoodItemSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().min(10).max(500),
  price: z.number().min(0),
  categoryIds: z
    .array(z.string())
    .min(1)
    .max(3, "Maximum 3 categories allowed"),
  calories: z.number().int().min(0).optional(),
});

export const updateFoodItemSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().min(10).max(500).optional(),
  price: z.number().min(0).optional(),
  categoryIds: z.array(z.string()).min(1).max(3).optional(),
  calories: z.number().int().min(0).optional(),
});

export type CreateFoodItemInput = z.infer<typeof createFoodItemSchema>;
export type UpdateFoodItemInput = z.infer<typeof updateFoodItemSchema>;
