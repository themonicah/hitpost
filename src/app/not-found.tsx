import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="text-gray-500 mb-6">This page doesn't exist.</p>
      <Link
        href="/"
        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium"
      >
        Go Home
      </Link>
    </div>
  );
}
