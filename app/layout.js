import "./globals.css";

export const metadata = {
  title: "Sri Keth | Business Control Center",
  description: "Sri Keth business management system",
  icons: {
    icon: "/sriketh-logo.png", // Next.js automatically maps the root '/' to the public folder
    apple: "/sriketh-logo.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
