import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.date(),
    author: z.string(),
    tags: z.array(z.string()),
    featured: z.boolean().optional().default(false),
    image: z.string().optional(),
  }),
});

export const collections = { posts };
