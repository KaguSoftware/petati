import { getTranslations } from "next-intl/server";
import { storeContext } from "@/lib/tenant/context";
import { getMyAddresses } from "@/lib/account/queries";
import { AddressList } from "@/components/storefront/account/address-form";

export default async function AddressesPage({ params }: PageProps<"/[locale]/s/[store]/account/addresses">) {
  const { store } = await storeContext(params);
  const [t, addresses] = await Promise.all([getTranslations("account"), getMyAddresses(store.id)]);
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold tracking-tight md:text-2xl">{t("addresses")}</h2>
      <AddressList storeSlug={store.slug} addresses={addresses} defaultCountry={(store.settings.default_country as string | undefined) ?? "TR"} />
    </div>
  );
}
