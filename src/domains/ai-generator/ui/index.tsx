import { Route } from "react-router-dom";
import { capabilitiesLoader } from "../runtime";
import { AIGenerator } from "./AIGenerator";
import { AILayout } from "./AILayout";
import { NetworkCapabilities } from "./NetworkCapabilities";
import { Settings } from "./Settings";
import { AudioToText } from "./inference/AudioToText";
import { ImageToImage } from "./inference/ImageToImage";
import { ImageToText } from "./inference/ImageToText";
import { ImageToVideo } from "./inference/ImageToVideo";
import { Llm } from "./inference/Llm";
import { OpenAiByoc } from "./inference/OpenAiByoc";
import { SegmentAnything2 } from "./inference/SegmentAnything2";
import { TextToImage } from "./inference/TextToImage";
import { TextToSpeech } from "./inference/TextToSpeech";
import { Upscale } from "./inference/Upscale";

export { AILayout } from "./AILayout";
export { AIGenerator } from "./AIGenerator";
export { Settings } from "./Settings";
export { NetworkCapabilities } from "./NetworkCapabilities";
export { TextToImage } from "./inference/TextToImage";
export { ImageToImage } from "./inference/ImageToImage";
export { Upscale } from "./inference/Upscale";
export { ImageToVideo } from "./inference/ImageToVideo";
export { ImageToText } from "./inference/ImageToText";
export { AudioToText } from "./inference/AudioToText";
export { TextToSpeech } from "./inference/TextToSpeech";
export { Llm } from "./inference/Llm";
export { OpenAiByoc } from "./inference/OpenAiByoc";
export { SegmentAnything2 } from "./inference/SegmentAnything2";
export { GeneratedImageCard } from "./inference/GeneratedImageCard";

/**
 * Routes are nested under `/ai`. AILayout owns the tab shell; child routes
 * render inside its Outlet. Every inference route is now wired to a real
 * component — `PlaceholderInference` is no longer in use.
 */
export const aiRoutes = (
  <Route path="ai" element={<AILayout />}>
    <Route index element={<AIGenerator />} />
    <Route path="generator" element={<AIGenerator />} />
    <Route path="settings" element={<Settings />} />
    <Route
      path="network-capabilities"
      element={<NetworkCapabilities />}
      loader={capabilitiesLoader}
    />

    <Route path="text-to-image" element={<TextToImage />} loader={capabilitiesLoader} />
    <Route path="image-to-image" element={<ImageToImage />} loader={capabilitiesLoader} />
    <Route path="upscale" element={<Upscale />} loader={capabilitiesLoader} />
    <Route path="image-to-video" element={<ImageToVideo />} loader={capabilitiesLoader} />
    <Route path="image-to-text" element={<ImageToText />} loader={capabilitiesLoader} />
    <Route path="audio-to-text" element={<AudioToText />} loader={capabilitiesLoader} />
    <Route path="text-to-speech" element={<TextToSpeech />} loader={capabilitiesLoader} />
    <Route path="llm" element={<Llm />} loader={capabilitiesLoader} />
    <Route path="byoc/openai" element={<OpenAiByoc />} loader={capabilitiesLoader} />
    <Route
      path="segment-anything-2"
      element={<SegmentAnything2 />}
      loader={capabilitiesLoader}
    />
  </Route>
);
