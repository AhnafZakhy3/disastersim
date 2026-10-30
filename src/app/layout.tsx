import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Nusantara Disaster Simulator — Indonesia Geological Hazards',
  description:
    'Web simulator dampak bencana alam geologis Indonesia (Letusan Gunung Berapi & Tsunami Megathrust) berbasis model empiris PVMBG & BMKG.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className="min-h-screen bg-[#070B14] text-slate-100 antialiased selection:bg-rose-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
