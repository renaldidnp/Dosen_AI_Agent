import "./globals.css";

export const metadata = {
  title: "Autograder Dosen",
  description: "Sistem koreksi otomatis terintegrasi Google Drive & Google Form",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="h-full">
      <body className="h-full bg-gray-50">{children}</body>
    </html>
  );
}