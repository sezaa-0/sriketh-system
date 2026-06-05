export const metadata = {
  title: "Spare Parts Inventory | Sri Keth",
  description: "Spare parts inventory and stock consumption tracker",
};

export default function InventoryLayout({ children }) {
  return (
    <div className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 overflow-x-clip">
      {children}
    </div>
  );
}
