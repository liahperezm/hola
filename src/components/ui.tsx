"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bookmark,
  BookOpen,
  Compass,
  Languages,
  Search,
  Settings,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { Logo } from "./logo";

const TABS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Traducir", icon: Languages },
  { href: "/explorar", label: "Explorar", icon: Compass },
  { href: "/guardados", label: "Guardados", icon: Bookmark },
];

/** A top-level screen: content plus the bottom tab bar. */
export function TabScreen({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col px-5 pt-[max(env(safe-area-inset-top),1rem)] pb-[calc(86px+env(safe-area-inset-bottom))]">
      {children}
      <TabBar />
    </div>
  );
}

function TabBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Secciones"
      className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-md border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <ul className="flex h-[70px] items-start justify-around pt-2.5">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex w-24 flex-col items-center gap-1 text-[11.5px] font-semibold ${
                  active ? "text-navy" : "text-[#8f8da6]"
                }`}
              >
                <Icon className="size-[22px]" strokeWidth={active ? 2.25 : 2} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Logo (or a page title) on the left, settings on the right. */
export function TopBar({ title }: { title?: string }) {
  return (
    <header className="flex h-12 items-center justify-between">
      {title ? (
        <h1 className="text-[32px] font-extrabold tracking-[-0.03em]">{title}</h1>
      ) : (
        <Logo className="h-9" />
      )}
      <IconLink href="/ajustes" label="Ajustes" icon={Settings} />
    </header>
  );
}

/** Back arrow on the left, optional actions on the right. */
export function PageHeader({
  fallback = "/",
  children,
}: {
  fallback?: string;
  children?: ReactNode;
}) {
  const router = useRouter();
  return (
    <header className="flex h-12 items-center justify-between">
      <IconButton
        label="Volver"
        onClick={() => {
          if (window.history.length > 1) router.back();
          else router.push(fallback);
        }}
      >
        <ArrowLeft className="size-5" />
      </IconButton>
      <div className="flex gap-2">{children}</div>
    </header>
  );
}

const ICON_BUTTON =
  "grid size-10 place-items-center rounded-full bg-white text-navy shadow-card transition hover:bg-lavender/60 active:scale-95";

export function IconButton({
  label,
  onClick,
  pressed,
  children,
}: {
  label: string;
  onClick: () => void;
  pressed?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
      className={ICON_BUTTON}
    >
      {children}
    </button>
  );
}

function IconLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
}) {
  return (
    <Link href={href} aria-label={label} className={ICON_BUTTON}>
      <Icon className="size-5" />
    </Link>
  );
}

export function SearchField({
  value,
  onChange,
  placeholder = "Busca una palabra o frase",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="flex h-[52px] items-center gap-2.5 rounded-full bg-white px-[18px] shadow-card">
      <Search className="size-[18px] shrink-0 text-muted" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-[15px] text-navy outline-none placeholder:text-muted"
      />
    </label>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="mx-1 mt-6 mb-3 text-[15px] font-bold">{children}</h2>;
}

/** White rounded card that holds rows separated by thin lines. */
export function ListCard({ children }: { children: ReactNode }) {
  return (
    <ul className="divide-y divide-line rounded-[22px] bg-white px-4 shadow-card">
      {children}
    </ul>
  );
}

export function EmptyState({
  icon: Icon = BookOpen,
  title,
  children,
}: {
  icon?: LucideIcon;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="mt-14 space-y-2 px-6 text-center">
      <Icon className="mx-auto mb-4 size-9 text-muted" />
      <p className="text-lg font-bold">{title}</p>
      {children && <p className="text-muted">{children}</p>}
    </div>
  );
}

export function capitalize(text: string): string {
  const i = text.search(/\p{L}/u);
  if (i === -1) return text;
  return text.slice(0, i) + text.charAt(i).toUpperCase() + text.slice(i + 1);
}
