import { z } from "zod";

export const svgSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  preview: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  userId: z.string(),
  isPublic: z.boolean(),
  tags: z.array(z.string()),
}); 