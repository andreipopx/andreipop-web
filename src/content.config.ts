import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const post = z.object({
  title: z.string(),
  date: z.date(),
  excerpt: z.string().optional(),
  cover: z.string().optional(),
  draft: z.boolean().default(false),
});

const viajes = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/viajes' }),
  schema: post,
});

const reflexiones = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/reflexiones' }),
  schema: post,
});

const papers = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/papers' }),
  schema: post.extend({
    venue: z.string().optional(),
    authors: z.array(z.string()).optional(),
    url: z.string().url().optional(),
  }),
});

const enlaces = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/enlaces' }),
  schema: post.extend({
    url: z.string().url(),
    source: z.string().optional(),
  }),
});

const proyectos = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/proyectos' }),
  schema: z.object({
    title: z.string(),
    tagline: z.string(),
    year: z.number(),
    accent: z.enum(['indigo', 'orange', 'emerald', 'violet', 'amber']).default('indigo'),
    initial: z.string().length(1),
    url: z.string().url().optional(),
    order: z.number().default(0),
    draft: z.boolean().default(false),
  }),
});

export const collections = { viajes, reflexiones, papers, enlaces, proyectos };
