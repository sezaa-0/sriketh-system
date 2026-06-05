export const metadata = {
  title: "Hand Loans | Sri Keth",
  description: "Hand loans — receivables and payables",
};

export default function HandLoansLayout({ children }) {
  return (
    <div className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 overflow-x-clip">
      {children}
    </div>
  );
}
