import Link from "next/link";

export function UserLink({
  user,
}: {
  user?: { _id?: string; email?: string; username?: string } | null;
}) {
  if (!user?.email)
    return <span className="text-muted-foreground">Deleted user</span>;
  if (!user._id) return <>{user.email}</>;
  return (
    <Link
      href={`/admin/users/${user._id}`}
      className="hover:text-brand font-medium underline-offset-4 hover:underline"
    >
      {user.email}
    </Link>
  );
}
