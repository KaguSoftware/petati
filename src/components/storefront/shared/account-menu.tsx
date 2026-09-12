"use client";

import { Heart, Languages, LogOut, Moon, Package, Settings2, Sun, User, UserPlus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useTransition } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { localeNames, type Locale } from "@/i18n/config";
import { signOutAction } from "@/lib/auth/actions";

export interface AccountMenuUser {
  name: string | null;
  email: string;
}

interface Props {
  user: AccountMenuUser | null;
  /** The store's enabled locales, so a shop that sells in one language shows no language row. */
  enabledLocales?: readonly string[];
}

function initial(user: AccountMenuUser) {
  const source = (user.name ?? "").trim() || user.email;
  return source.charAt(0).toUpperCase();
}

/**
 * One menu for everything that is "about me": the account, the colour scheme and the language.
 *
 * These used to be three separate controls in the navbar's end cluster, which alongside search and
 * the cart made five — enough to wrap onto a second row. The cart deliberately stays OUT of here:
 * it is the primary conversion path and carries a live count, so it must stay one click away.
 *
 * The trigger doubles as the signed-in indicator. Before this, signed-in and signed-out rendered an
 * identical person icon and the only difference was where the click landed.
 */
export function AccountMenu({ user, enabledLocales }: Props) {
  const t = useTranslations("common");
  const tn = useTranslations("nav");
  const ta = useTranslations("account");
  const tAuth = useTranslations("auth");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [, startLocale] = useTransition();

  const locales = (Object.keys(localeNames) as Locale[]).filter((l) => !enabledLocales || enabledLocales.includes(l));

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon-lg" className="rounded-full" aria-label={user ? t("accountMenu") : tn("signIn")} />}
      >
        {user ? (
          <Avatar size="sm">
            <AvatarFallback className="bg-primary text-primary-foreground">{initial(user)}</AvatarFallback>
          </Avatar>
        ) : (
          <User className="size-5" />
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-56">
        {user ? (
          <>
            {/* The label MUST sit inside a Group: it renders Base UI's Menu.GroupLabel, which
                throws "MenuGroupContext is missing" without one — taking the whole page down, not
                just the menu. */}
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex flex-col gap-0.5">
                {user.name && <span className="truncate font-medium text-foreground">{user.name}</span>}
                <span className="truncate text-caption font-normal text-muted-foreground" dir="ltr">
                  {user.email}
                </span>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/account" />}>
              <Package />
              {ta("orders")}
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href="/account/wishlist" />}>
              <Heart />
              {tn("wishlist")}
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href="/account/profile" />}>
              <Settings2 />
              {ta("title")}
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem render={<Link href="/sign-in" />}>
              <User />
              {tn("signIn")}
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href="/sign-up" />}>
              <UserPlus />
              {tAuth("signUp")}
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Sun className="dark:hidden" />
            <Moon className="hidden dark:block" />
            {t("theme")}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup value={theme ?? "system"} onValueChange={(v) => setTheme(String(v))}>
              <DropdownMenuRadioItem value="light">{t("themeLight")}</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">{t("themeDark")}</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system">{t("themeSystem")}</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {locales.length > 1 && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Languages />
              {t("language")}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup
                value={locale}
                onValueChange={(value) => {
                  const next = String(value) as Locale;
                  if (!next || next === locale) return;
                  document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; samesite=lax`;
                  startLocale(() => router.replace(pathname, { locale: next }));
                }}
              >
                {locales.map((l) => (
                  <DropdownMenuRadioItem key={l} value={l}>
                    {localeNames[l]}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}

        {user && (
          <>
            <DropdownMenuSeparator />
            <form action={signOutAction.bind(null, locale)}>
              <DropdownMenuItem render={<button type="submit" className="w-full" />} variant="destructive">
                <LogOut />
                {tn("signOut")}
              </DropdownMenuItem>
            </form>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
