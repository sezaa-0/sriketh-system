export const metadata = {
  title: "Bank Loans | Sri Keth",
  description: "Bank loan tracker and debt management",
};

export default function BankLoansLayout({ children }) {
  return (
    <div className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 overflow-x-clip">
      {children}
    </div>
  );
}
