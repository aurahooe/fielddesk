import "./globals.css";

export const metadata = {
  title: "Field Desk",
  description: "A late desk. Public wall, private drawer, a pulse every hour.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
