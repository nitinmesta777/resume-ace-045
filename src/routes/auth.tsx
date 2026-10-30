import { Outlet, createFileRoute } from "@tanstack/react-router";
import iconMark from "@/assets/icon-mark.png";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in | AI Resume Analyzer" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12 sm:py-16">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <img src={iconMark} alt="" className="size-9 rounded-lg" width={36} height={36} />
          <span className="font-display text-lg font-semibold tracking-tight">
            AI Resume Analyzer
          </span>
        </div>
        <div className="card-elevated rounded-xl p-6 sm:p-7">
          <Outlet />
        </div>
      </div>
    </main>
  );
}
