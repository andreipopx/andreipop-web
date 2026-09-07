import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { site } from '../config/site';

export async function GET(context: { site?: URL }) {
  const notas = await getCollection('notas');
  return rss({
    title: site.name,
    description: site.bio,
    site: context.site ?? new URL('https://andreipop.org'),
    items: notas
      .filter((n) => !n.data.draft)
      .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
      .map((n) => ({
        title: n.data.title,
        pubDate: n.data.date,
        description: n.data.excerpt ?? '',
        link: `/notas/${n.id}/`,
        categories: n.data.tags,
      })),
  });
}
