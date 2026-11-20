"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CircleArrowRight, Search } from "lucide-react";
import type { ReactNode } from "react";

/** Navy title bar with a back arrow, as on Mi diccionario and Favoritos. */
export function TitleBar({
  title,
  back = "/",
  children,
}: {
  title: string;
  back?: string;
  children?: ReactNode;
}) {
  return (
    <header className="bg-navy px-6 pt-[max(env(safe-area-inset-top),1.25rem)] pb-5 text-white">
      <div className="relative flex h-9 items-center justify-center">
        <BackButton fallback={back} />
        <h1 className="text-[15px] font-bold tracking-[0.16em] uppercase">
          {title}
        </h1>
      </div>
      {children}
    </header>
  );
}

export function BackButton({ fallback = "/" }: { fallback?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      aria-label="Volver"
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push(fallback);
      }}
      className="absolute left-0 -ml-2 rounded-full p-2 hover:bg-white/10"
    >
      <ArrowLeft className="size-6" strokeWidth={2.5} />
    </button>
  );
}

export function SearchField({
  value,
  onChange,
  placeholder = "Busca",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="flex h-[54px] items-center gap-3 rounded-full bg-field px-7">
      <Search className="size-4 shrink-0 text-ink" strokeWidth={3} />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-lg text-ink outline-none placeholder:text-muted placeholder:italic"
      />
    </label>
  );
}

/** White rounded card with an arrow, as in the dictionary and translation lists. */
export function CardLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-[84px] items-center gap-4 rounded-[22px] bg-white px-7 py-4 transition hover:shadow-md active:scale-[0.99]"
    >
      <div className="min-w-0 flex-1">{children}</div>
      <CircleArrowRight className="size-7 shrink-0 text-muted" strokeWidth={2} />
    </Link>
  );
}

/** "Chamaquito / Pelado": the word in gray, its equivalent in navy bold. */
export function TermPairText({ from, to }: { from: string; to: string }) {
  return (
    <>
      <p className="text-lg text-muted">{capitalize(from)}</p>
      <p className="text-xl font-bold text-navy">{capitalize(to)}</p>
    </>
  );
}

export function capitalize(text: string): string {
  const i = text.search(/\p{L}/u);
  if (i === -1) return text;
  return text.slice(0, i) + text.charAt(i).toUpperCase() + text.slice(i + 1);
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h2 className="px-4 text-[13px] font-bold tracking-[0.14em] uppercase">
      {children}
    </h2>
  );
}
