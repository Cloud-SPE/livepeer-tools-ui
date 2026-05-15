import { TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface Props {
  /** ISO YYYY-MM-DD seed value. */
  initialDate: string;
  /** Builds the URL to navigate to when the date changes. */
  buildPath: (iso: string) => string;
  label?: string;
}

/**
 * A controlled date input that navigates to a new URL when the user
 * commits a new value. Mirrors the old SimpleDateInput.
 */
export function DateInput({ initialDate, buildPath, label = "Date" }: Props): JSX.Element {
  const navigate = useNavigate();
  const [value, setValue] = useState(initialDate);

  useEffect(() => {
    setValue(initialDate);
  }, [initialDate]);

  return (
    <TextField
      label={label}
      type="date"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        if (value && value !== initialDate) navigate(buildPath(value));
      }}
      InputLabelProps={{ shrink: true }}
      sx={{ mt: 2, mb: 2, maxWidth: 240 }}
    />
  );
}
