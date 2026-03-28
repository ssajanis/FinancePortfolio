import { testConnection } from "@/lib/supabase";

export default async function Page() {
  let success = false;
  let error = "";

  try {
    const result = await testConnection();
    success = result.success;
    error = result.error ?? "";
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold mb-2" style={{ color: "#00c853" }}>Welcome to FinanceOS</h1>
      <p className="mb-6" style={{ color: "#e8f5e9" }}>Your personal finance dashboard</p>
      {success ? (
        <p style={{ color: "#00c853" }}>Database connected ✅</p>
      ) : (
        <p style={{ color: "#ef5350" }}>Database error ❌ — {error}</p>
      )}
    </div>
  );
}
