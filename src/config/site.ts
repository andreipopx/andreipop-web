export const site = {
  name: 'andreipop.org',
  domain: 'andreipop.org',
  author: 'Andrei Pop',
  bio: 'Hola. Aquí escribo notas, hago cosas y guardo intereses que valen la pena.',
  hero: {
    salutation: 'Hola, soy',
    name: 'Andrei',
    kicker: 'Hago cosas.',
  },
  social: {
    github: 'https://github.com/andreipopx',
    linkedin: '#',
    email: null as string | null,
    rss: '/rss.xml',
  },

  /** Endpoints y keys públicas del backend. */
  api: {
    baseUrl: 'https://andreipop-api.mrandreipop.workers.dev',
    turnstileSiteKey: '0x4AAAAAAEr9hGhp4o0sSfMd',
    cloudinaryCloudName: 'up7czvhe',
  },

  /** Apps del dock. Cada una es una ventana en el escritorio. */
  apps: [
    { slug: 'notas',     label: 'Notas',     accent: 'amber',   icon: 'note' },
    { slug: 'cosas',     label: 'Cosas',     accent: 'violet',  icon: 'box' },
    { slug: 'intereses', label: 'Intereses', accent: 'red',     icon: 'star' },
    { slug: 'galeria',   label: 'Galería',   accent: 'pink',    icon: 'photos' },
    { slug: 'vida',      label: 'Vida',      accent: 'emerald', icon: 'compass' },
    { slug: 'firma',     label: 'Firma',     accent: 'teal',    icon: 'pen' },
    { slug: 'contacto',  label: 'Contacto',  accent: 'blue',    icon: 'mail' },
  ] as const,
} as const;

export type App = (typeof site.apps)[number];
