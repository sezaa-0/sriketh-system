import { DashboardShell } from "@/components/dashboard/DashboardShell";

/**
 * Shared dashboard shell: home has no navbar; sub-routes get top navbar + full-width content.
 */
export default function DashboardLayout({ children }) {
  return <DashboardShell>{children}</DashboardShell>;
}
