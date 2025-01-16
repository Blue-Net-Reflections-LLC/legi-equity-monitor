import { notFound } from "next/navigation";

// For now, only Georgia
const VALID_STATES = new Set(["GA"]);

// Helper to check if a string is a valid state code
function isStateCode(param: string): boolean {
  // State codes should be exactly 2 characters and in our valid set
  return param.length === 2 && VALID_STATES.has(param.toUpperCase());
}

export default function StateLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { state: string };
}) {
  // If it's not a valid state code format, let Next.js continue to other routes
  if (!isStateCode(params.state)) {
    notFound();
  }

  // If it's a valid format but not an enabled state, show 404
  if (!VALID_STATES.has(params.state.toUpperCase())) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900 pt-8">
      {children}
    </div>
  );
} 