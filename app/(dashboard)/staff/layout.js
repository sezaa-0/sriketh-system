export const metadata = {
  title: "Staff & Payroll | Sri Keth",
  description: "Staff registry and payroll",
};

export default function StaffLayout({ children }) {
  return (
    <div className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 overflow-x-clip">
      {children}
    </div>
  );
}
