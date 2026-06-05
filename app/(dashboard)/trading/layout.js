export const metadata = {
  title: "Trip Management | Sri Keth",
  description: "Unified trip logistics — inward stocking and outward sales",
};

/**
 * Full-bleed shell for trading — escapes dashboard max-width constraint.
 */
export default function TradingLayout({ children }) {
  return (
    <div className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 overflow-x-clip">
      {children}
    </div>
  );
}
