import { DashboardShell } from "@/components/dashboard/DashboardShell";

/**
 * Shared dashboard shell: home has no navbar; sub-routes get navbar with Back → `/` on the left.
 */
export default function DashboardLayout({ children }) {
  return <DashboardShell>{children}</DashboardShell>;
}
