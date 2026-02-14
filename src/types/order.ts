import { z } from "zod";

export const createOrderSchema = z.object({
  restaurantId: z.string().min(1),
  items: z
    .array(
      z.object({
        foodItemId: z.string().min(1),
        quantity: z.number().int().min(1),
      }),
    )
    .min(1),
  addressId: z.string().min(1),
  paymentMethodId: z.string().min(1),
  customerNotes: z.string().max(500).optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
