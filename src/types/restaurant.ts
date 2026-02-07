import { z } from "zod";

export const createRestaurantSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().min(10).max(500).optional(),
  address: z.string().min(10).max(200).optional(),
  deliveryFee: z.number().min(0).default(0),
  openingTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
  closingTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
});

export const updateRestaurantSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().min(10).max(500).optional(),
  address: z.string().min(10).max(200).optional(),
  deliveryFee: z.number().min(0).optional(),
  openingTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional(),
  closingTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional(),
});

export type CreateRestaurantInput = z.infer<typeof createRestaurantSchema>;
export type UpdateRestaurantInput = z.infer<typeof updateRestaurantSchema>;
