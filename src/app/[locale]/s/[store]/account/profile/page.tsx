import { getTranslations } from "next-intl/server";
import { storeContext } from "@/lib/tenant/context";
import { requireUser } from "@/lib/auth/session";
import { defaultCountryForLocale } from "@/lib/phone/countries";
import { splitPhone } from "@/lib/phone/normalize";
import { PasswordForm, ProfileForm } from "@/components/storefront/account/profile-forms";

export default async function ProfilePage({ params }: PageProps<"/[locale]/s/[store]/account/profile">) {
  const { locale } = await storeContext(params);
  const [t, user] = await Promise.all([getTranslations("account"), requireUser(locale, `/${locale}/account/profile`)]);
  const phone = splitPhone(user.profile.phone, user.profile.phone_country ?? defaultCountryForLocale(locale));
  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">{t("profile")}</h2>
        <ProfileForm fullName={user.profile.full_name ?? ""} email={user.email ?? ""} phone={phone} />
      </section>
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">{t("password")}</h2>
        <PasswordForm />
      </section>
    </div>
  );
}
