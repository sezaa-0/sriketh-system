export const metadata = {
  title: "Day Cash Book Ledger | Sri Keth",
  description: "Daily cash deposits and withdrawals ledger",
};

export default function DayCashLayout({ children }) {
  return (
    <div className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 overflow-x-clip bg-white">
      {children}
    </div>
  );
}
