"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { voiceRate } from "./storage";

/** Reads text aloud with a voice for the dialect when the device has one. */
export function speak(text: string, lang: string, rate?: number) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const synth = window.speechSynthesis;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = rate ?? voiceRate();
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
  abort?: () => void;
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

  const silence = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Words heard but not yet final. */
  const heard = useRef("");

  // Ends the session for good: some browsers (Android Chrome, iOS Safari)
  // keep the microphone open after the last word unless told to stop.
  const finish = useCallback(() => {
    if (heard.current) {
      const text = heard.current;
      heard.current = "";
      onTextRef.current(text, true);
    }
    if (silence.current) clearTimeout(silence.current);
    silence.current = null;
    const r = recognition.current;
    recognition.current = null;
    if (r) {
      r.onresult = null;
      r.onend = null;
      r.onerror = null;
      try {
        r.abort?.() ?? r.stop();
      } catch {
        // Already stopped.
      }
    }
    setListening(false);
  }, []);

  // Leaving the screen or changing the language drops what's in progress.
  const cancel = useCallback(() => {
    heard.current = "";
    finish();
  }, [finish]);

  useEffect(() => {
    setSupported(Boolean(recognitionConstructor()));
    return cancel;
  }, [cancel]);

  useEffect(() => cancel, [lang, cancel]);

  const start = useCallback(() => {
    const Ctor = recognitionConstructor();
    if (!Ctor) return;
    cancel();
    setError(null);
    const r = new Ctor();
    r.lang = lang;
    r.interimResults = true;
    r.continuous = false;
    // Stop after a pause, even if the browser hasn't noticed the silence.
    const waitForSilence = (ms: number) => {
      if (silence.current) clearTimeout(silence.current);
      silence.current = setTimeout(() => {
        finish();
      }, ms);
    };
    r.onresult = (event) => {
      const results = Array.from(event.results);
      const text = results.map((res) => res[0]?.transcript ?? "").join("");
      const final = results.every((res) => res.isFinal);
      heard.current = final ? "" : text;
      onTextRef.current(text, final);
      if (final) finish();
      else waitForSilence(2000);
    };
    r.onerror = (event) => {
      if (event.error !== "aborted") {
        setError(
          event.error === "not-allowed"
            ? "Permite el micrófono para dictar."
            : "No te escuchamos bien. Intenta otra vez.",
        );
      }
      finish();
    };
    r.onend = () => {
      finish();
    };
    recognition.current = r;
    r.start();
    setListening(true);
    // Nothing said at all: give up after a while.
    waitForSilence(8000);
  }, [lang, finish, cancel]);

  /** Stop button: keeps what was heard so far. */
  const stop = finish;

  return { supported, listening, error, start, stop };
}
