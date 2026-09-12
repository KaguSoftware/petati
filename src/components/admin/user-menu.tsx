"use client";

import { LogOut, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "@/i18n/navigation";
import { signOutAction } from "@/lib/auth/actions";
import type { EffectiveRole } from "@/lib/db/types";

interface Props {
  locale: string;
  user: { name: string; email: string; avatarUrl: string | null };
  role: EffectiveRole;
}

function initials(name: string, email: string) {
  const source = name.trim() || email;
  return source
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function UserMenu({ locale, user, role }: Props) {
  const t = useTranslations("admin");
  const signOut = signOutAction.bind(null, locale);
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-lg" className="rounded-full" aria-label={t("nav.userMenu")} />}>
        <Avatar size="sm">
          {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
          <AvatarFallback>{initials(user.name, user.email) || <User className="size-4" />}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        {/* Must be inside a Group — Base UI's Menu.GroupLabel throws without one. */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="truncate font-medium text-foreground">{user.name || user.email}</span>
            <span className="truncate text-xs font-normal text-muted-foreground" dir="ltr">
              {user.email}
            </span>
            <span className="text-[11px] font-normal tracking-wide text-muted-foreground uppercase">{t(`roles.${role}`)}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/account/profile" />}>
          <User />
          {t("nav.profile")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <form action={signOut}>
          <DropdownMenuItem render={<button type="submit" className="w-full" />} variant="destructive">
            <LogOut />
            {t("nav.signOut")}
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
