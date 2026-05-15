import { createTheme } from "@mui/material/styles";

declare module "@mui/material/styles" {
  interface BreakpointOverrides {
    "2xl": true;
  }
}

export const theme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
      "2xl": 2560,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        outlined: {
          color: "white",
          borderColor: "white",
          "&:hover": {
            borderColor: "lightgray",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
          },
        },
      },
    },
  },
});
