import { Poppins } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['100','200','300','400','500','600','700','800','900'],
  style: ['normal','italic'],
  display: 'swap',
});

export const metadata = {
  title: 'Techno EEE – Learn & Grow',
  description: 'Unlock Your Potential and Make an Impact with Your Skills!',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"
        />
      </head>
      <body className={poppins.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
