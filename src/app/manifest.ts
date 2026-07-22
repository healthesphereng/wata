import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Wata — Baby Tracker',
    short_name: 'Wata',
    description: 'The one-handed baby tracker — feeds, sleep, and diapers logged in a tap or two.',
    start_url: '/today',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f4efe9',
    theme_color: '#f4efe9',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
