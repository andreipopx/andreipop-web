export const site = {
  name: 'andreipop.org',
  domain: 'andreipop.org',
  author: 'Andrei Pop',
  bio: '[una línea sobre ti]. Aquí escribo lo que aprendo, guardo viajes y enlaces que me parece que valen.',
  hero: {
    salutation: 'Hola, soy',
    name: 'Andrei',
  },
  social: {
    github: 'https://github.com/andreipopx',
    linkedin: '#',
    email: null as string | null, // se activará cuando Cloudflare Email Routing esté configurado
    rss: '/feed.xml',
  },
  nav: [
    { label: 'Viajes',       href: '/viajes/' },
    { label: 'Reflexiones',  href: '/reflexiones/' },
    { label: 'Papers',       href: '/papers/' },
    { label: 'Enlaces',      href: '/enlaces/' },
    { label: 'Proyectos',    href: '/proyectos/' },
  ] as const,
} as const;

export type NavItem = (typeof site.nav)[number];
