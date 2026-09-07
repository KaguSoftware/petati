import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations();
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-6xl font-semibold">404</p>
      <p className="text-muted-foreground">{t("common.notFound")}</p>
      <Link href="/" className="text-primary underline underline-offset-4">
        {t("nav.home")}
      </Link>
    </main>
  );
}
