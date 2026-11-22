"use client";

import { Check } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import { PageHeader } from "@/components/ui";
import { useT } from "@/lib/i18n";
import { FREE_SENTENCES_PER_DAY, PLANS, PLUS_FEATURES } from "@/lib/plus";

type Plan = (typeof PLANS)[number]["id"];

/** Hola Plus. Payments aren't connected yet, so the button joins a waitlist. */
export default function Plus() {
  const { t, language } = useT();
  const [plan, setPlan] = useState<Plan>("yearly");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  const ids = useId();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setState("sending");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, plan, language, website }),
      });
      const body = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(body.error ?? "No pudimos guardarte en la lista. Intenta más tarde.");
      setState("sent");
    } catch (err) {
      setError(err instanceof Error && !(err instanceof TypeError) ? t(err.message) : t("No hay conexión. Intenta otra vez."));
      setState("idle");
    }
  };

  return (
    <main className="px-5 pt-[max(env(safe-area-inset-top),1rem)] pb-12">
      <PageHeader fallback="/preferencias" />
      <h1 className="mx-1 mt-5 text-[34px] font-extrabold tracking-[-0.03em]">Hola Plus</h1>
      <p className="mx-1 mt-1 text-[16px] text-muted">
        {t("Para quien habla con medio mundo hispano.")}
      </p>

      <ul className="mt-6 space-y-1 rounded-[22px] bg-white px-5 py-2 shadow-card">
        {PLUS_FEATURES.map((f) => (
          <li key={f.title} className="flex gap-4 py-3">
            <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-lavender text-[18px] font-bold">
              {f.emoji}
            </span>
            <span>
              <span className="block text-[16px] font-bold">{t(f.title)}</span>
              <span className="block text-[14.5px] text-muted">
                {t(f.detail, { free: FREE_SENTENCES_PER_DAY })}
              </span>
            </span>
          </li>
        ))}
      </ul>

      {state === "sent" ? (
        <div role="status" className="mt-6 rounded-[22px] bg-mint px-5 py-5">
          <p className="flex items-center gap-2 text-[17px] font-bold">
            <Check aria-hidden className="size-5" />
            {t("¡Estás en la lista!")}
          </p>
          <p className="mt-1 text-[15px] text-body">
            {t("Te escribiremos cuando Hola Plus esté listo, con 7 días gratis para probarlo.")}
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-6">
          <fieldset>
            <legend className="mx-1 mb-3 text-[15px] font-semibold text-muted">{t("Elige tu plan")}</legend>
            <div className="grid grid-cols-2 gap-3">
              {PLANS.map((p) => (
                <label
                  key={p.id}
                  className={`relative cursor-pointer rounded-[22px] bg-white px-4 py-4 shadow-card outline-offset-2 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-navy ${
                    plan === p.id ? "ring-3 ring-navy" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="plan"
                    value={p.id}
                    checked={plan === p.id}
                    onChange={() => setPlan(p.id)}
                    className="sr-only"
                  />
                  {"save" in p && (
                    <span className="absolute -top-2.5 right-3 rounded-full bg-navy px-2 py-0.5 text-[11.5px] font-bold text-white">
                      {t(p.save)}
                    </span>
                  )}
                  <span className="block text-[14px] font-semibold text-muted">{t(p.name)}</span>
                  <span className="mt-1 block text-[24px] font-extrabold tracking-[-0.02em]">{p.price}</span>
                  <span className="block text-[13px] text-muted">{t(p.per)}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <label htmlFor={`${ids}-email`} className="mx-1 mt-6 block text-[15px] font-semibold">
            {t("Tu correo")}
          </label>
          <input
            id={`${ids}-email`}
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-describedby={`${ids}-why`}
            className="mt-2 h-13 w-full rounded-full border border-line bg-white px-5 text-[16px]"
          />
          <p id={`${ids}-why`} className="mx-1 mt-2 text-[13.5px] text-muted">
            {t("Todavía no cobramos. Te avisamos cuando abra, y solo para eso.")}
          </p>
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="hidden"
          />
          {error && (
            <p role="alert" className="mx-1 mt-3 text-[14.5px] font-semibold text-danger">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={state === "sending"}
            className="mt-5 h-14 w-full rounded-full bg-navy text-[16px] font-bold text-white disabled:opacity-70"
          >
            {state === "sending" ? t("Enviando…") : t("Unirme a la lista de espera")}
          </button>
          <p className="mx-1 mt-3 text-center text-[13.5px] text-muted">
            {t("7 días gratis al abrir. Cancela cuando quieras.")}
          </p>
        </form>
      )}
    </main>
  );
}
