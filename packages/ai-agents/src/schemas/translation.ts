import { z } from "zod";

export const translationSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
});

export type Translation = z.infer<typeof translationSchema>;
