export const metadata = {
  title: "Bank Deposits | Sri Keth",
  description: "Bank deposit logger",
};

export default function DepositsLayout({ children }) {
  return (
    <div className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 overflow-x-clip">
      {children}
    </div>
  );
}
