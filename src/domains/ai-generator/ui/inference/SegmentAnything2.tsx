import type { JSX } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import type Konva from "konva";
import { Circle, Image as KonvaImage, Layer, Rect, Stage } from "react-konva";
import useImage from "use-image";
import { PIPELINE_NAMES, SAM2_DISPLAY_WIDTH, SEGMENT_ANYTHING_2_DEFAULTS } from "../../config";
import { useModels, useSegmentAnything2Mutation } from "../../runtime";
import {
  buildBoxString,
  buildPointCoords,
  sam2StageDimensions,
  validateSegmentAnything2,
} from "../../service";
import type { Sam2Mode, SegmentAnything2Form } from "../../types";
import { ModelSelect } from "./InferenceFields";
import { MaskedImageCanvas } from "./MaskedImageCanvas";

interface RectProps {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PointProps {
  x: number;
  y: number;
}

export function SegmentAnything2(): JSX.Element {
  const [form, setForm] = useState<SegmentAnything2Form>(SEGMENT_ANYTHING_2_DEFAULTS);
  const [errors, setErrors] = useState<string[]>([]);
  const [mode, setMode] = useState<Sam2Mode>("box");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [image] = useImage(imageUrl ?? "");
  const [rect, setRect] = useState<RectProps | null>(null);
  const [point, setPoint] = useState<PointProps | null>(null);
  const [boxStart, setBoxStart] = useState<PointProps | null>(null);

  const { models } = useModels(PIPELINE_NAMES.segmentAnything2);
  const mutation = useSegmentAnything2Mutation();

  useEffect(() => {
    if (!form.model_id && models.length > 0 && models[0]) {
      setForm((prev) => ({ ...prev, model_id: models[0] ?? "" }));
    }
  }, [models, form.model_id]);

  const { stageWidth, stageHeight, scaleFactor } = useMemo(
    () => sam2StageDimensions(image?.width ?? 0, image?.height ?? 0),
    [image?.width, image?.height],
  );

  const update = <K extends keyof SegmentAnything2Form>(
    key: K,
    value: SegmentAnything2Form[K],
  ): void => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onFileChange = (file: File | null): void => {
    update("image", file);
    setRect(null);
    setPoint(null);
    setBoxStart(null);
    update("point_coords", "");
    update("point_labels", "");
    update("box", "");
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === "string") setImageUrl(result);
      };
      reader.readAsDataURL(file);
    } else {
      setImageUrl(null);
    }
  };

  const onModeChange = (next: Sam2Mode): void => {
    setMode(next);
    setRect(null);
    setPoint(null);
    setBoxStart(null);
    update("point_coords", "");
    update("point_labels", "");
    update("box", "");
  };

  const pointerInImageSpace = (e: Konva.KonvaEventObject<MouseEvent>): PointProps | null => {
    const stage = e.target.getStage();
    if (!stage) return null;
    const pos = stage.getPointerPosition();
    if (!pos) return null;
    return { x: pos.x / scaleFactor, y: pos.y / scaleFactor };
  };

  const onStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>): void => {
    if (mode !== "box") return;
    const p = pointerInImageSpace(e);
    if (!p) return;
    setBoxStart(p);
    setRect(null);
  };

  const onStageMouseUp = (e: Konva.KonvaEventObject<MouseEvent>): void => {
    if (mode !== "box" || !boxStart) return;
    const p = pointerInImageSpace(e);
    if (!p) return;
    const newRect: RectProps = {
      x: boxStart.x,
      y: boxStart.y,
      width: p.x - boxStart.x,
      height: p.y - boxStart.y,
    };
    setRect(newRect);
    update("box", buildBoxString(boxStart.x, boxStart.y, p.x, p.y));
    setBoxStart(null);
  };

  const onStageClick = (e: Konva.KonvaEventObject<MouseEvent>): void => {
    if (mode !== "point") return;
    const p = pointerInImageSpace(e);
    if (!p) return;
    setPoint(p);
    update("point_coords", buildPointCoords(p.x, p.y));
    update("point_labels", "[0]");
  };

  const onSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    const v = validateSegmentAnything2(form);
    setErrors(v);
    if (v.length === 0) mutation.mutate(form);
  };

  return (
    <Grid container spacing={2}>
      <Grid
        size={{
          xs: 12,
          md: 6,
        }}
      >
        <Card>
          <CardContent>
            <Typography variant="h6">Upload your image and click Segment Anything 2</Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" component="div">
                <p>To segment an image:</p>
                <ol>
                  <li>Upload an image.</li>
                  <li>Draw a box around the region you want to segment.</li>
                  <li>
                    Or switch to Point mode and click a single pixel inside the region instead.
                  </li>
                  <li>
                    Click <b>Segment Anything 2</b>.
                  </li>
                  <li>The segmented regions appear below as overlays.</li>
                </ol>
              </Typography>
            </Box>

            {mutation.error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {mutation.error.message}
              </Alert>
            )}
            {errors.length > 0 && (
              <Alert severity="error" sx={{ mt: 2, whiteSpace: "pre-line" }}>
                {errors.join("\n")}
              </Alert>
            )}

            <Box component="form" onSubmit={onSubmit}>
              <Box sx={{ mt: 2 }}>
                <Button variant="contained" component="label">
                  Choose a file
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
                  />
                </Button>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {form.image ? form.image.name : "No file uploaded"}
                </Typography>
              </Box>

              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={mutation.isPending}
                sx={{ my: 2 }}
              >
                {mutation.isPending ? "Processing…" : "Segment Anything 2"}
              </Button>
              {mutation.isPending && <LinearProgress sx={{ mb: 2 }} />}

              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Model</InputLabel>
                <ModelSelect
                  value={form.model_id}
                  models={models}
                  onChange={(v) => update("model_id", v)}
                />
              </FormControl>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={mode === "point"}
                    onChange={(e) => onModeChange(e.target.checked ? "point" : "box")}
                  />
                }
                label="Use Point"
                sx={{ mt: 1 }}
              />

              {mode === "point" ? (
                <>
                  <TextField
                    label="Point Coordinates"
                    value={form.point_coords}
                    onChange={(e) => update("point_coords", e.target.value)}
                    fullWidth
                    sx={{ mt: 2 }}
                  />
                  <TextField
                    label="Point Labels"
                    value={form.point_labels}
                    onChange={(e) => update("point_labels", e.target.value)}
                    fullWidth
                    sx={{ mt: 2 }}
                  />
                </>
              ) : (
                <TextField
                  label="Box"
                  value={form.box}
                  onChange={(e) => update("box", e.target.value)}
                  fullWidth
                  sx={{ mt: 2 }}
                />
              )}
              <TextField
                label="Mask Input"
                value={form.mask_input}
                onChange={(e) => update("mask_input", e.target.value)}
                fullWidth
                sx={{ my: 2 }}
              />
              <FormControl fullWidth sx={{ my: 2 }}>
                <InputLabel>Multimask Output</InputLabel>
                <Select
                  label="Multimask Output"
                  value={form.multimask_output ? "true" : "false"}
                  onChange={(e) => update("multimask_output", e.target.value === "true")}
                >
                  <MenuItem value="true">True</MenuItem>
                  <MenuItem value="false">False</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth sx={{ my: 2 }}>
                <InputLabel>Return Logits</InputLabel>
                <Select
                  label="Return Logits"
                  value={form.return_logits ? "true" : "false"}
                  onChange={(e) => update("return_logits", e.target.value === "true")}
                >
                  <MenuItem value="true">True</MenuItem>
                  <MenuItem value="false">False</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth sx={{ my: 2 }}>
                <InputLabel>Normalize Coords</InputLabel>
                <Select
                  label="Normalize Coords"
                  value={form.normalize_coords ? "true" : "false"}
                  onChange={(e) => update("normalize_coords", e.target.value === "true")}
                >
                  <MenuItem value="true">True</MenuItem>
                  <MenuItem value="false">False</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth sx={{ my: 2 }}>
                <InputLabel>Safety Check</InputLabel>
                <Select
                  label="Safety Check"
                  value={form.safety_check ? "true" : "false"}
                  onChange={(e) => update("safety_check", e.target.value === "true")}
                >
                  <MenuItem value="true">True</MenuItem>
                  <MenuItem value="false">False</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Seed"
                value={form.seed}
                onChange={(e) => update("seed", e.target.value)}
                fullWidth
                sx={{ my: 2 }}
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid
        size={{
          xs: 12,
          md: 6,
        }}
      >
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Your Uploaded Image
            </Typography>
            {image && (
              <Stage
                width={stageWidth}
                height={stageHeight}
                scaleX={scaleFactor}
                scaleY={scaleFactor}
                onMouseDown={onStageMouseDown}
                onMouseUp={onStageMouseUp}
                onClick={onStageClick}
              >
                <Layer>
                  <KonvaImage image={image} />
                  {rect && (
                    <Rect
                      x={rect.x}
                      y={rect.y}
                      width={rect.width}
                      height={rect.height}
                      stroke="red"
                      strokeWidth={2}
                    />
                  )}
                  {point && <Circle x={point.x} y={point.y} radius={5} fill="red" />}
                </Layer>
              </Stage>
            )}
          </CardContent>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Your Selected Image Output
            </Typography>
            {form.image && (mutation.data?.masks.length ?? 0) > 0 ? (
              mutation.data?.masks.map((mask, idx) => (
                <MaskedImageCanvas
                  key={idx}
                  maskData={mask}
                  imageFile={form.image as File}
                  maxDisplayWidth={SAM2_DISPLAY_WIDTH}
                />
              ))
            ) : (
              <Typography variant="body2">No segmented outputs yet.</Typography>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
