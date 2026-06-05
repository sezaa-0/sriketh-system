export const metadata = {
  title: "Fuel Tank Control | Sri Keth",
  description: "Diesel bulk management and fuel consumption tracker",
};

export default function DieselLayout({ children }) {
  return (
    <div className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 overflow-x-clip">
      {children}
    </div>
  );
}
