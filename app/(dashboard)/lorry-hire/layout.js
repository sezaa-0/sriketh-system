export const metadata = {
  title: "Lorry Hire Log | Sri Keth",
};

export default function LorryHireLayout({ children }) {
  return (
    <div className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 overflow-x-clip">
      {children}
    </div>
  );
}
