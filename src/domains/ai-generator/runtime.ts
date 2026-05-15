import { useEffect, useState } from "react";
import { useMutation, useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { LoaderFunctionArgs } from "react-router-dom";
import { queryClient } from "@/utils/queryClient";
import {
  fetchCapabilities,
  loadGatewaySettings,
  postAudioToText,
  postByocChat,
  postByocEmbedding,
  postByocImage,
  postImageToImage,
  postImageToText,
  postImageToVideo,
  postLlm,
  postSegmentAnything2,
  postTextToImage,
  postTextToSpeech,
  postUpscale,
  saveGatewaySettings,
} from "./repo";
import { flattenCapabilities, modelsForPipeline } from "./service";
import type {
  AudioToTextForm,
  AudioToTextResponse,
  ByocChatInvocation,
  ByocChatResult,
  ByocEmbeddingForm,
  ByocEmbeddingResult,
  ByocImageForm,
  ByocImageResult,
  CapabilitiesView,
  GatewaySettingsView,
  ImageToImageForm,
  ImageToTextForm,
  ImageToVideoForm,
  ImagesResponse,
  LlmInvocation,
  LlmResponse,
  SegmentAnything2Form,
  SegmentAnything2Result,
  TextResponse,
  TextToImageForm,
  TextToSpeechForm,
  TextToSpeechResponse,
  UpscaleForm,
  VideoResponse,
} from "./types";

const CAPABILITIES_KEY = ["ai", "capabilities"] as const;

const capabilitiesConfig = () => ({
  queryKey: CAPABILITIES_KEY,
  queryFn: async (): Promise<CapabilitiesView> => {
    const raw = await fetchCapabilities();
    return flattenCapabilities(raw);
  },
  // Gateway state churns; refresh on a 60s cadence.
  staleTime: 60_000,
});

export function useCapabilities(): UseQueryResult<CapabilitiesView, Error> {
  return useQuery(capabilitiesConfig());
}

export function invalidateCapabilities(): void {
  void queryClient.invalidateQueries({ queryKey: CAPABILITIES_KEY });
}

/**
 * Reactive view of the current gateway settings persisted in localStorage.
 * Re-reads on mount and whenever a save fires (via window-level event so
 * any open Settings component stays in sync if multiple tabs are open).
 */
const SETTINGS_EVENT = "ai-gateway-settings-changed";

export function useGatewaySettings(): {
  settings: GatewaySettingsView;
  save: (next: GatewaySettingsView) => void;
} {
  const [settings, setSettings] = useState<GatewaySettingsView>(() => loadGatewaySettings());

  useEffect(() => {
    const handler = (): void => setSettings(loadGatewaySettings());
    window.addEventListener(SETTINGS_EVENT, handler);
    return () => window.removeEventListener(SETTINGS_EVENT, handler);
  }, []);

  const save = (next: GatewaySettingsView): void => {
    saveGatewaySettings(next);
    setSettings(next);
    invalidateCapabilities();
    window.dispatchEvent(new Event(SETTINGS_EVENT));
  };

  return { settings, save };
}

export async function capabilitiesLoader(_args: LoaderFunctionArgs): Promise<null> {
  await queryClient.prefetchQuery(capabilitiesConfig());
  return null;
}

/* ---------- inference ---------- */

/** Model list for a single pipeline, resolved from the cached capabilities. */
export function useModels(pipelineName: string): { models: string[]; isLoading: boolean } {
  const q = useCapabilities();
  return {
    models: modelsForPipeline(q.data, pipelineName),
    isLoading: q.isLoading,
  };
}

export function useTextToImageMutation() {
  return useMutation<ImagesResponse, Error, TextToImageForm>({
    mutationFn: postTextToImage,
  });
}

export function useImageToImageMutation() {
  return useMutation<ImagesResponse, Error, ImageToImageForm>({
    mutationFn: postImageToImage,
  });
}

export function useUpscaleMutation() {
  return useMutation<ImagesResponse, Error, UpscaleForm>({
    mutationFn: postUpscale,
  });
}

/* ---------- media inference (plan 011) ---------- */

export function useImageToVideoMutation() {
  return useMutation<VideoResponse, Error, ImageToVideoForm>({
    mutationFn: postImageToVideo,
  });
}

export function useImageToTextMutation() {
  return useMutation<TextResponse, Error, ImageToTextForm>({
    mutationFn: postImageToText,
  });
}

export function useAudioToTextMutation() {
  return useMutation<AudioToTextResponse, Error, AudioToTextForm>({
    mutationFn: postAudioToText,
  });
}

export function useTextToSpeechMutation() {
  return useMutation<TextToSpeechResponse, Error, TextToSpeechForm>({
    mutationFn: postTextToSpeech,
  });
}

/* ---------- LLM (plan 012) ---------- */

export function useLlmMutation() {
  return useMutation<LlmResponse, Error, LlmInvocation>({
    mutationFn: postLlm,
  });
}

/* ---------- BYOC OpenAI (plan 013) ---------- */

export function useByocChatMutation() {
  return useMutation<ByocChatResult, Error, ByocChatInvocation>({
    mutationFn: postByocChat,
  });
}

export function useByocImageMutation() {
  return useMutation<ByocImageResult, Error, ByocImageForm>({
    mutationFn: postByocImage,
  });
}

export function useByocEmbeddingMutation() {
  return useMutation<ByocEmbeddingResult, Error, ByocEmbeddingForm>({
    mutationFn: postByocEmbedding,
  });
}

/* ---------- SAM-2 (plan 014) ---------- */

export function useSegmentAnything2Mutation() {
  return useMutation<SegmentAnything2Result, Error, SegmentAnything2Form>({
    mutationFn: postSegmentAnything2,
  });
}
