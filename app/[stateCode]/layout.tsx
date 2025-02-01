import { notFound } from "next/navigation";

// Helper to check if a string is a valid state code format
function isStateCode(param: string): boolean {
  // State codes should be exactly 2 characters
  return param.length === 2;
}

interface Props {
  children: React.ReactNode;
  params: { stateCode: string };
}

export default function StateLayout({ children, params }: Props) {
  // If it's not a valid state code format, show 404
  if (!isStateCode(params.stateCode)) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900 pt-8">
      {children}
    </div>
  );
} 