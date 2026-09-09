import "./globals.css";
import { ThemeProvider } from "./theme-provider";

export const metadata = {
  title: "Autograder Dosen",
  description: "Sistem koreksi otomatis terintegrasi Google Drive",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('nexus-theme');
                  var theme = saved;
                  if (!theme) {
                    var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    theme = systemDark ? 'dark' : 'light';
                  }
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}