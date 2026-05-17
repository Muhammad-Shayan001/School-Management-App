export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-pulse">
        <div className="space-y-3">
          <div className="h-4 w-32 bg-bg-tertiary rounded-full" />
          <div className="h-12 w-64 md:w-80 bg-bg-tertiary rounded-2xl" />
          <div className="h-4 w-48 bg-bg-tertiary rounded-full" />
        </div>
        <div className="h-14 w-48 bg-bg-tertiary rounded-2xl hidden md:block" />
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div 
            key={i} 
            className="h-32 bg-bg-tertiary rounded-[2.5rem] border border-border/40 relative overflow-hidden animate-pulse"
            style={{ animationDelay: `${i * 150}ms` }}
          >
            <div className="absolute top-6 left-6 h-10 w-10 bg-white/20 rounded-xl" />
            <div className="absolute bottom-6 left-6 space-y-2">
               <div className="h-3 w-16 bg-white/20 rounded-full" />
               <div className="h-5 w-24 bg-white/20 rounded-full" />
            </div>
          </div>
        ))}
      </div>

      {/* Content Area Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 h-[500px] bg-bg-tertiary rounded-[2.5rem] border border-border/40 animate-pulse" style={{ animationDelay: '600ms' }} />
        <div className="h-[500px] bg-bg-tertiary rounded-[2.5rem] border border-border/40 animate-pulse" style={{ animationDelay: '800ms' }} />
      </div>
    </div>
  );
}
