import { Suspense } from "react";
import LoginPageClient from "./LoginPageClient";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white text-sm font-semibold text-neutral-500">
          Loading...
        </div>
      }
    >
      <LoginPageClient />
    </Suspense>
  );
}
