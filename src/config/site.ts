export const site = {
  name: 'andreipop.org',
  domain: 'andreipop.org',
  author: 'Andrei Pop',
  bio: '[una línea sobre ti]. Aquí escribo notas, hago cosas y guardo intereses.',
  hero: {
    salutation: 'Hola, soy',
    name: 'Andrei',
    kicker: 'Hago cosas.',
  },
  social: {
    github: 'https://github.com/andreipopx',
    linkedin: '#',
    email: null as string | null,
    rss: '/feed.xml',
  },
  /**
   * Apps del dock. Cada una es una ventana en el escritorio.
   * `slug` es el path del deep-link: /notas/, /cosas/, /intereses/, /vida/, /contacto/
   */
  apps: [
    { slug: 'notas',     label: 'Notas',     accent: 'amber',   icon: 'note' },
    { slug: 'cosas',     label: 'Cosas',     accent: 'violet',  icon: 'box' },
    { slug: 'intereses', label: 'Intereses', accent: 'red',     icon: 'star' },
    { slug: 'vida',      label: 'Vida',      accent: 'emerald', icon: 'compass' },
    { slug: 'contacto',  label: 'Contacto',  accent: 'blue',    icon: 'mail' },
  ] as const,
} as const;

export type App = (typeof site.apps)[number];
