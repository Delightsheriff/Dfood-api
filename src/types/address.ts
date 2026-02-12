import { z } from "zod";

export const createAddressSchema = z.object({
  label: z.string().min(2).max(50),
  street: z.string().min(5).max(200),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
});

export const updateAddressSchema = z.object({
  label: z.string().min(2).max(50).optional(),
  street: z.string().min(5).max(200).optional(),
  city: z.string().min(2).max(100).optional(),
  state: z.string().min(2).max(100).optional(),
  coordinates: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    })
    .optional(),
});

export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
