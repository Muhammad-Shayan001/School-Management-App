import { PageSpinner } from '@/app/_components/ui/spinner';

/**
 * Global loading UI shown during page transitions.
 */
export default function Loading() {
  return (
    <div className="flex flex-1 items-center justify-center min-h-screen">
      <PageSpinner label="Loading..." />
    </div>
  );
}
