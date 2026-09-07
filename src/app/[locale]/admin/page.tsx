import { getTranslations } from "next-intl/server";

// SCOPE(admin): dashboard KPIs arrive in step 5. GROWS LATER → sales, orders, low stock widgets.
export default async function AdminDashboard() {
  const t = await getTranslations("admin");
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold">{t("dashboard")}</h1>
      <p className="text-muted-foreground">Coming soon.</p>
    </div>
  );
}
