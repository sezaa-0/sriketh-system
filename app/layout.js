import "./globals.css";

export const metadata = {
  title: "Sri Keth | Business Control Center",
  description: "Sri Keth business management system",
  manifest: "/manifest.json",
  icons: {
    icon: "/sriketh-logo.png",
    apple: "/logo.png",
  },
  appleWebApp: {
    capable: true,
    title: "Sri Keth ERP",
    statusBarStyle: "black-translucent",
  },
};

export const viewport = {
  themeColor: "#059669",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
