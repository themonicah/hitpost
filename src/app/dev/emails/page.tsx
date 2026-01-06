import db from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DevEmailsPage() {
  const emails = await db.getEmails();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Sent Emails (Dev)</h1>
          <Link href="/" className="text-blue-500 hover:text-blue-600">
            ← Home
          </Link>
        </div>

        {emails.length === 0 ? (
          <p className="text-gray-500 text-center py-12">
            No emails sent yet. Create a dump to see emails here.
          </p>
        ) : (
          <div className="space-y-4">
            {emails.map((email) => (
              <div
                key={email.id}
                className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium">To: {email.to_email}</p>
                    <p className="text-sm text-gray-500">{email.subject}</p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(email.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap mb-3">
                  {email.body}
                </p>
                <a
                  href={email.link}
                  className="inline-block px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium"
                >
                  Open Link →
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
