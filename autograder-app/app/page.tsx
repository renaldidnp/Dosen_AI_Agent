import Link from "next/link";

export default function RootPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Autograder</h1>
        <Link href="/dashboard" className="bg-blue-600 text-white px-4 py-2 rounded-md">
          Masuk Dashboard
        </Link>
      </div>
    </div>
  );
}
