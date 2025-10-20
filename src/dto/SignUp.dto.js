import { z } from "zod";

export const CreateUserSchema = z.object({
  firstname: z
    .string({ required_error: "First name is required" })
    .min(2, "First name must be between 2 and 50 characters")
    .max(50, "First name must be between 2 and 50 characters")
    .regex(/^[A-Za-z\s]+$/, "First name can only contain alphabets and spaces")
    .transform((val) => val.trim()),

  lastname: z
    .string({ required_error: "Last name is required" })
    .min(2, "Last name must be between 2 and 50 characters")
    .max(50, "Last name must be between 2 and 50 characters")
    .regex(/^[A-Za-z\s]+$/, "Last name can only contain alphabets and spaces")
    .transform((val) => val.trim()),

  email: z
    .string({ required_error: "Email is required" })
    .email("Please enter a valid email address")
    .transform((val) => val.trim().toLowerCase()),

  passwordhash: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(50, "Password cannot exceed 50 characters")
    .regex(
      /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    )
    .transform((val) => val.trim())
    .optional(),

  address: z
    .string()
    .max(200, "Address cannot exceed 200 characters")
    .transform((val) => val.trim())
    .optional(),

  city: z
    .string()
    .max(100, "City cannot exceed 100 characters")
    .transform((val) => val.trim())
    .optional(),

  province: z
    .string()
    .max(100, "Province cannot exceed 100 characters")
    .transform((val) => val.trim())
    .optional(),

  postalcode: z
    .string()
    .max(20, "Postal code cannot exceed 20 characters")
    .transform((val) => val.trim())
    .optional(),

  phoneno: z
    .string()
    .max(20, "Phone number cannot exceed 20 characters")
    .regex(/^[0-9+\-\s()]*$/, "Phone number format is invalid")
    .transform((val) => val.trim())
    .optional(),
});
