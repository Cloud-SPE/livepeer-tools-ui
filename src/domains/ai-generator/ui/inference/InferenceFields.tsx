import type { JSX } from "react";
import { Box, FormControl, InputLabel, MenuItem, Select, TextField } from "@mui/material";

interface ModelSelectProps {
  value: string;
  models: string[];
  onChange: (value: string) => void;
}

export function ModelSelect({ value, models, onChange }: ModelSelectProps): JSX.Element {
  return (
    <FormControl fullWidth sx={{ mb: 2 }}>
      <InputLabel id="model-label">Model</InputLabel>
      <Select
        labelId="model-label"
        label="Model"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
      >
        {models.length > 0 ? (
          models.map((m) => (
            <MenuItem key={m} value={m}>
              {m}
            </MenuItem>
          ))
        ) : (
          <MenuItem disabled value="">
            No models available
          </MenuItem>
        )}
      </Select>
    </FormControl>
  );
}

interface SafetyCheckSelectProps {
  value: boolean;
  onChange: (value: boolean) => void;
}

export function SafetyCheckSelect({ value, onChange }: SafetyCheckSelectProps): JSX.Element {
  return (
    <FormControl fullWidth sx={{ mb: 2 }}>
      <InputLabel id="safety-label">Safety Check</InputLabel>
      <Select
        labelId="safety-label"
        label="Safety Check"
        value={value ? "true" : "false"}
        onChange={(e) => onChange(e.target.value === "true")}
      >
        <MenuItem value="false">False</MenuItem>
        <MenuItem value="true">True</MenuItem>
      </Select>
    </FormControl>
  );
}

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  required?: boolean;
}

export function NumberField({
  label,
  value,
  onChange,
  step,
  required = false,
}: NumberFieldProps): JSX.Element {
  return (
    <TextField
      label={label}
      type="number"
      value={Number.isFinite(value) ? value : ""}
      onChange={(e) => {
        const v = e.target.value;
        onChange(v === "" ? Number.NaN : Number(v));
      }}
      fullWidth
      required={required}
      sx={{ mb: 2 }}
      slotProps={{ htmlInput: step != null ? { step } : undefined }}
    />
  );
}

interface SeedFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export function SeedField({ value, onChange }: SeedFieldProps): JSX.Element {
  return (
    <TextField
      label="Seed"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      fullWidth
      placeholder="Optional seed value"
      sx={{ mb: 2 }}
    />
  );
}

interface FilePickerProps {
  file: File | null;
  onPick: (file: File | null) => void;
  label?: string;
}

export function FilePicker({ file, onPick, label = "Upload Image" }: FilePickerProps): JSX.Element {
  return (
    <Box sx={{ mb: 2 }}>
      <Box component="label" sx={{ display: "inline-block" }}>
        <input
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => onPick(e.target.files?.[0] ?? null)}
        />
        <Box
          component="span"
          sx={{
            display: "inline-block",
            px: 2,
            py: 1,
            backgroundColor: "primary.main",
            color: "primary.contrastText",
            borderRadius: 1,
            cursor: "pointer",
          }}
        >
          {label}
        </Box>
      </Box>
      <Box sx={{ mt: 1, color: "text.secondary", fontSize: "0.875rem" }}>
        {file ? file.name : "No file uploaded"}
      </Box>
    </Box>
  );
}
