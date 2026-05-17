'use client';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center">
      <div className="h-20 w-20 rounded-full bg-danger/10 flex items-center justify-center">
        <svg className="h-10 w-10 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h2 className="text-2xl font-black text-text-primary tracking-tight uppercase">Something went wrong!</h2>
      <p className="text-text-secondary max-w-md font-medium">
        We encountered an error while loading this dashboard section. This might be due to a temporary connection issue.
      </p>
      <button
        onClick={() => reset()}
        className="px-8 py-3 rounded-2xl gradient-bg text-white font-black shadow-xl shadow-accent/20 hover:shadow-accent/40 transition-all duration-300"
      >
        Try Again
      </button>
    </div>
  );
}
