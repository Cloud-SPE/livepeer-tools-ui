import { Box, Button } from "@mui/material";
import { Link } from "react-router-dom";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";
import { shiftPeriod } from "../service";
import type { PeriodKind } from "../types";

interface Props {
  kind: PeriodKind;
  currentDate: string;
  /** Query string to preserve on navigation (e.g. job_type). */
  search?: string;
}

export function DateNav({ kind, currentDate, search = "" }: Props): JSX.Element {
  const prev = shiftPeriod(kind, currentDate, -1);
  const next = shiftPeriod(kind, currentDate, 1);
  const q = search ? `?${search}` : "";
  return (
    <Box sx={{ mt: 3, display: "flex", gap: 1, justifyContent: "space-between" }}>
      <Button
        component={Link}
        to={`/reports/${kind}/${prev}${q}`}
        startIcon={<ChevronLeft />}
        variant="outlined"
      >
        Previous
      </Button>
      <Button
        component={Link}
        to={`/reports/${kind}/${next}${q}`}
        endIcon={<ChevronRight />}
        variant="outlined"
      >
        Next
      </Button>
    </Box>
  );
}
