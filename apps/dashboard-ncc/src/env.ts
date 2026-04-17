import { z } from "zod";

const schema = z.object({
  VITE_API_BASE_URL: z.string().url().default("http://localhost:5050"),
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().min(20),
});

const parsed = schema.safeParse(import.meta.env);

if (!parsed.success) {
  console.error("[env] Invalid environment variables:", parsed.error.format());
  throw new Error("[dashboard-ncc] Required environment variables are missing or invalid.");
}

export const env = parsed.data;
