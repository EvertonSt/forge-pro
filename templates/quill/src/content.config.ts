import { defineCollection, z } from 'astro:content';

const docs = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    order: z.number().optional().default(0),
    section: z.string().optional().default('general'),
    version: z.string().optional().default('v2'),
  }),
});

export const collections = { docs };
