export const metadata = {
  title: "Cheque Registry | Sri Keth",
  description: "Cheque tracker and cash flow",
};

export default function ChequesLayout({ children }) {
  return (
    <div className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 overflow-x-clip">
      {children}
    </div>
  );
}
