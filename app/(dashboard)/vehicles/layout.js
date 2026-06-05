export const metadata = {
  title: "Vehicle Fleet Care | Sri Keth",
  description: "Vehicle maintenance",
};

export default function VehiclesLayout({ children }) {
  return (
    <div className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 overflow-x-clip">
      {children}
    </div>
  );
}
