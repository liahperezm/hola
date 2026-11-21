"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { voiceRate } from "./storage";

/** Reads text aloud with a voice for the dialect when the device has one. */
export function speak(text: string, lang: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const synth = window.speechSynthesis;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = voiceRate();
  // On-device voices honor the speed; some online voices ignore it.
  const voices = synth.getVoices().filter((v) => v.lang.startsWith("es"));
  const exact = voices.filter((v) => v.lang.replace("_", "-") === lang);
  const pick = (list: SpeechSynthesisVoice[]) =>
    list.find((v) => v.localService) ?? list[0];
  const voice = pick(exact) ?? pick(voices);
  if (voice) utterance.voice = voice;
  if (synth.speaking || synth.pending) {
    synth.cancel();
    // Chrome can drop an utterance queued in the same tick as cancel().
    setTimeout(() => synth.speak(utterance), 60);
  } else {
    synth.speak(utterance);
  }
}

export function canSpeak(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/* The Web Speech API's recognition types are not in TypeScript's DOM lib. */
type RecognitionResult = { transcript: string };
type RecognitionEvent = {
  results: ArrayLike<ArrayLike<RecognitionResult> & { isFinal: boolean }>;
};
type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: RecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  start: () => void;
  stop: () => void;
};
type RecognitionConstructor = new () => Recognition;

function recognitionConstructor(): RecognitionConstructor | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

/** Dictation into the text field, in the source dialect. */
export function useDictation(
  lang: string,
  onText: (text: string, final: boolean) => void,
) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognition = useRef<Recognition | null>(null);
  const onTextRef = useRef(onText);

  useEffect(() => {
    onTextRef.current = onText;
  }, [onText]);

  useEffect(() => {
    setSupported(Boolean(recognitionConstructor()));
    return () => recognition.current?.stop();
  }, []);

  const start = useCallback(() => {
    const Ctor = recognitionConstructor();
    if (!Ctor) return;
    setError(null);
    const r = new Ctor();
    r.lang = lang;
    r.interimResults = true;
    r.continuous = false;
    r.onresult = (event) => {
      const results = Array.from(event.results);
      const text = results.map((res) => res[0]?.transcript ?? "").join("");
      onTextRef.current(text, results.every((res) => res.isFinal));
    };
    r.onerror = (event) => {
      setError(
        event.error === "not-allowed"
          ? "Permite el micrófono para dictar."
          : "No te escuchamos bien. Intenta otra vez.",
      );
    };
    r.onend = () => setListening(false);
    recognition.current = r;
    r.start();
    setListening(true);
  }, [lang]);

  const stop = useCallback(() => recognition.current?.stop(), []);

  return { supported, listening, error, start, stop };
}
