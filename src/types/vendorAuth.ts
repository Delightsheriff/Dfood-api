import { z } from "zod";

export const vendorSignupSchema = z.object({
  firstName: z.string().min(1, "First name required"),
  lastName: z.string().min(1, "Last name required"),
  email: z.email("Invalid email address"),
  phone: z.string().min(10, "Invalid phone number"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  restaurantName: z.string().min(2, "Restaurant name required").max(100),
  restaurantAddress: z.string().min(10, "Full address required"),
  deliveryFee: z.coerce.number().min(0, "Delivery fee must be 0 or more"),
  openingTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)"),
  closingTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)"),
  description: z.string().max(500).optional(),
});

export type VendorSignupInput = z.infer<typeof vendorSignupSchema>;
