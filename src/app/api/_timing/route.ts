import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getStoreBySlug, listStores } from "@/lib/tenant/store";

/**
 * TEMPORARY diagnostic (platform owner only): times each server primitive where it actually runs.
 * Remove once the admin navigation budget is settled.
 */
export async function GET() {
  const t: Record<string, number> = {};
  const lap = async <T>(name: string, fn: () => Promise<T>) => {
    const s = performance.now();
    const r = await fn();
    t[name] = Math.round(performance.now() - s);
    return r;
  };

  const supabase = await lap("createServerClient", () => createSupabaseServerClient());
  const claims = await lap("getClaims", async () => (await supabase.auth.getClaims()).data?.claims);
  if (!claims?.sub) return NextResponse.json({ error: "anon" }, { status: 401 });
  const profile = await lap("profileQuery", async () => (await supabase.from("profiles").select("platform_role").eq("id", claims.sub).maybeSingle()).data);
  if (profile?.platform_role !== "owner") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  await lap("getClaims#2", () => supabase.auth.getClaims());
  await lap("getUser(network)", () => supabase.auth.getUser());
  const admin = createSupabaseAdminClient();
  await lap("adminQuery ordersCount", async () => await admin.from("orders").select("id", { count: "exact", head: true }));
  await lap("adminQuery ordersCount#2", async () => await admin.from("orders").select("id", { count: "exact", head: true }));
  await lap("listStores(use cache)", () => listStores());
  await lap("listStores(use cache)#2", () => listStores());
  await lap("getStoreBySlug(use cache)", () => getStoreBySlug("default"));
  await lap("getTranslations", () => getTranslations("admin"));
  await lap("getTranslations#2", () => getTranslations("common"));
  await lap("parallel 4 admin queries", () =>
    Promise.all([
      admin.from("orders").select("id", { count: "exact", head: true }),
      admin.from("products").select("id", { count: "exact", head: true }),
      admin.from("reviews").select("id", { count: "exact", head: true }),
      admin.from("customers").select("id", { count: "exact", head: true }),
    ]),
  );
  return NextResponse.json({ region: process.env.VERCEL_REGION ?? null, node: process.version, t });
}
