import { useState } from "react";
import {
  Box,
  Card,
  CardMedia,
  Dialog,
  DialogContent,
} from "@mui/material";

interface Props {
  imageSrc: string;
  alt?: string;
}

/**
 * Displays a generated image as a clickable thumbnail. Opens a full-size
 * dialog on click. The image-to-video chain lives in a later plan (011).
 */
export function GeneratedImageCard({ imageSrc, alt = "Generated image" }: Props): JSX.Element {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Card>
        <CardMedia
          component="img"
          height="140"
          image={imageSrc}
          alt={alt}
          onClick={() => setOpen(true)}
          sx={{ cursor: "pointer", objectFit: "cover" }}
        />
      </Card>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="lg">
        <DialogContent>
          <Box
            component="img"
            src={imageSrc}
            alt={alt}
            sx={{
              width: "100%",
              height: "auto",
              maxHeight: "90vh",
              objectFit: "contain",
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
