export const metadata = {
  title: "Expenses & Utilities | Sri Keth",
  description: "Utility expenses and ultimate profit dashboard",
};

export default function ExpensesLayout({ children }) {
  return (
    <div className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 overflow-x-clip">
      {children}
    </div>
  );
}
