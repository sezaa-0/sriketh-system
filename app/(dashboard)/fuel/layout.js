export const metadata = {
  title: "Fuel Management | Sri Keth",
  description: "Vehicle fuel purchases, credit tracking, and installment payments",
};

export default function FuelLayout({ children }) {
  return (
    <div className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 overflow-x-clip bg-white">
      {children}
    </div>
  );
}
