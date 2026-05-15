import { Alert, Box, Typography } from "@mui/material";
import { useLocation } from "react-router-dom";

/**
 * Stand-in for inference routes (text-to-image, llm, etc.) that haven't
 * been ported yet. Lets the AILayout tab bar link to all the legacy URLs
 * without 404s. Each route lands here until plan 010+ ships its real UI.
 */
export function PlaceholderInference(): JSX.Element {
  const { pathname } = useLocation();
  return (
    <Box sx={{ py: 6 }}>
      <Typography variant="h4" gutterBottom>
        Coming soon
      </Typography>
      <Alert severity="info" sx={{ maxWidth: 720 }}>
        The inference UI for <code>{pathname}</code> hasn't shipped yet. The gateway and
        settings pieces are wired up — the inference forms land in a follow-up plan.
      </Alert>
    </Box>
  );
}
