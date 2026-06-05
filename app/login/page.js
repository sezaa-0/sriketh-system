import Link from "next/link";
import { BrandLogo } from "@/components/ui/BrandLogo";

export const metadata = {
  title: "Sri Keth | ශ්‍රී කෙත්",
  description: "Sign in to Sri Keth ERP",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6">
      <div className="w-full max-w-sm">
        <BrandLogo variant="stacked" size="lg" className="mb-10" />

        <div className="rounded-3xl border border-neutral-100 bg-white p-6 shadow-card sm:p-8">
          <p className="text-center text-[15px] font-medium text-neutral-800" lang="si">
            ලොග් වෙන්න
          </p>
          <p className="mt-1 text-center text-[12px] text-neutral-400">
            Sign in (coming soon)
          </p>

          <Link
            href="/trading"
            className="btn-primary mt-6 flex w-full flex-col items-center gap-0.5 py-3.5"
          >
            <span lang="si">වෙළඳාමට යන්න</span>
            <span className="text-[11px] font-normal text-emerald-100">
              Continue to Trading
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
