/** Gentle page transition so navigation feels like an app, not a reload. */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-1 flex min-w-0 flex-col gap-6 duration-300">
      {children}
    </div>
  );
}
