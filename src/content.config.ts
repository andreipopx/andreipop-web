import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const notas = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/notas' }),
  schema: z.object({
    title: z.string(),
    date: z.date(),
    kind: z.enum(['nota', 'ensayo', 'paper']).default('nota'),
    excerpt: z.string().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const cosas = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/cosas' }),
  schema: z.object({
    title: z.string(),
    tagline: z.string(),
    year: z.number(),
    kind: z.enum(['proyecto', 'paper', 'charla', 'otro']).default('proyecto'),
    accent: z.enum(['indigo', 'orange', 'emerald', 'violet', 'amber']).default('indigo'),
    initial: z.string().length(1),
    url: z.string().url().optional(),
    repo: z.string().url().optional(),
    tags: z.array(z.string()).default([]),
    order: z.number().default(0),
    draft: z.boolean().default(false),
  }),
});

const vida = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/vida' }),
  schema: z.object({
    title: z.string().default('Ahora'),
    updated: z.date(),
  }),
});

export const collections = { notas, cosas, vida };
