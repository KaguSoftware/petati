import {
  Boxes,
  Circle,
  LayoutDashboard,
  Package,
  Palette,
  Settings,
  ShoppingBag,
  Star,
  Store,
  Ticket,
  Truck,
  UserCog,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

/** Explicit map so the client bundle ships a dozen icons, not the whole lucide library. */
export const NAV_ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Boxes,
  Users,
  Ticket,
  Star,
  Wallet,
  Palette,
  UserCog,
  Settings,
  Store,
  Truck,
};

export function navIcon(name: string): LucideIcon {
  return NAV_ICONS[name] ?? Circle;
}
