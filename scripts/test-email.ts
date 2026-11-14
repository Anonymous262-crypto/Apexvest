import { sendEmail } from "@/lib/email/brevo";
import { emails } from "@/lib/email/templates";

const to = process.argv[2];
if (!to) {
  console.error("Usage: npm run test:email -- you@example.com");
  process.exit(1);
}
sendEmail({ to, ...emails.test() }).then((r) => {
  console.log(r.ok ? `Sent test email to ${to}` : `Failed: ${r.error}`);
  process.exit(r.ok ? 0 : 1);
});
