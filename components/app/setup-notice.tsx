import { Database } from "lucide-react";

export function SetupNotice() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="max-w-md space-y-3 text-center">
        <Database className="text-brand mx-auto size-8" aria-hidden="true" />
        <h1 className="text-xl font-semibold">Database not connected</h1>
        <p className="text-muted-foreground text-sm">
          Add your MongoDB connection string as{" "}
          <code className="bg-muted rounded px-1">MONGODB_URI</code> in{" "}
          <code className="bg-muted rounded px-1">.env.local</code>, then
          restart the server and run{" "}
          <code className="bg-muted rounded px-1">npm run seed</code>.
        </p>
      </div>
    </div>
  );
}
