import { Box, Dialog, DialogContent, DialogTitle } from "@mui/material";
import { prettyJson } from "../service";

interface Props {
  open: boolean;
  title: string;
  payload: string | null;
  onClose: () => void;
}

export function PayloadModal({ open, title, payload, onClose }: Props): JSX.Element {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Box
          component="pre"
          sx={{
            m: 0,
            p: 2,
            backgroundColor: (t) => t.palette.grey[100],
            borderRadius: 1,
            fontFamily: "monospace",
            fontSize: "0.85rem",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            maxHeight: "70vh",
            overflow: "auto",
          }}
        >
          {prettyJson(payload)}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
