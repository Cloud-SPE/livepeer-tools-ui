import type { JSX } from "react";
import { Box, Card, CardContent, Container, Divider, Grid, Typography } from "@mui/material";

interface Feature {
  title: string;
  body: string;
}

const FEATURES: ReadonlyArray<Feature> = [
  {
    title: "Image Generation",
    body: "Generate images from text prompts via Livepeer's AI gateway. Customize resolution, number of outputs, and style.",
  },
  {
    title: "Video Generation",
    body: "Create videos from static images, with configurable motion effects and frame rates.",
  },
  {
    title: "Speech Generation",
    body: "Transform text into realistic speech across multiple voice models.",
  },
  {
    title: "Text Analysis",
    body: "Run LLM-backed text analysis and summarization workflows.",
  },
  {
    title: "Model Customization",
    body: "Tune inference parameters per model — guidance scales, steps, samplers.",
  },
  {
    title: "Real-Time Preview",
    body: "Preview generated content in real time before finalizing outputs.",
  },
];

export function AIGenerator(): JSX.Element {
  return (
    <Container sx={{ maxWidth: "lg", py: 6 }}>
      <Box sx={{ textAlign: "center", mb: 6 }}>
        <Typography variant="h2" gutterBottom>
          AI Generator
        </Typography>
        <Typography variant="h5" color="text.secondary">
          A Livepeer AI Image, Video, Audio, and LLM testing tool.
        </Typography>
      </Box>
      <Grid container spacing={4}>
        {FEATURES.map((f) => (
          <Grid
            key={f.title}
            size={{
              xs: 12,
              md: 4,
            }}
          >
            <Card elevation={3} sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
                  {f.title}
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  {f.body}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
