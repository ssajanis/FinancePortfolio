import { testConnection } from "@/lib/supabase";

export default async function Page() {
  let status: string;

  try {
    const result = await testConnection();
    status = result.success ? "Database connected ✅" : `Connection error: ${result.error}`;
  } catch (e) {
    status = `Connection error: ${e instanceof Error ? e.message : String(e)}`;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <p>{status}</p>
    </div>
  );
}
