import type { JSX } from "react";
import { useEffect, useState } from "react";
import {
  AppBar,
  Box,
  Container,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ThemeProvider,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Link, Outlet } from "react-router-dom";
import MenuIcon from "@mui/icons-material/Menu";
import HomeIcon from "@mui/icons-material/Home";
import GroupsIcon from "@mui/icons-material/Groups";
import Assessment from "@mui/icons-material/Assessment";
import Memory from "@mui/icons-material/Memory";
import NetworkCheck from "@mui/icons-material/NetworkCheck";
import Webhook from "@mui/icons-material/Webhook";
import HowToVoteIcon from "@mui/icons-material/HowToVote";
import { theme } from "./theme";

interface MenuItemDef {
  text: string;
  icon: JSX.Element;
  path: string;
}

const MENU_ITEMS: ReadonlyArray<MenuItemDef> = [
  { text: "Home", icon: <HomeIcon />, path: "/" },
  { text: "Orchestrators", icon: <GroupsIcon />, path: "/orchestrators" },
  { text: "Gateways", icon: <Webhook />, path: "/gateways" },
  { text: "Reports", icon: <Assessment />, path: "/reports" },
  { text: "Performance", icon: <NetworkCheck />, path: "/performance/leaderboard" },
  { text: "Treasury Voting", icon: <HowToVoteIcon />, path: "/vote/history" },
  { text: "AI Generator", icon: <Memory />, path: "/ai/generator" },
];

export function App(): JSX.Element {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppShell />
    </ThemeProvider>
  );
}

function AppShell(): JSX.Element {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);

  useEffect(() => {
    setDrawerOpen(!isMobile);
  }, [isMobile]);

  const toggleDrawer = (): void => setDrawerOpen((v) => !v);

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar
        position="fixed"
        sx={{
          ml: !isMobile && drawerOpen ? "250px" : 0,
          width: !isMobile && drawerOpen ? "calc(100% - 250px)" : "100%",
          transition: muiTheme.transitions.create(["margin", "width"], {
            easing: muiTheme.transitions.easing.sharp,
            duration: muiTheme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={toggleDrawer}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Livepeer Tools by Livepeer.Cloud SPE
          </Typography>
        </Toolbar>
      </AppBar>

      <Drawer
        variant={isMobile ? "temporary" : "persistent"}
        open={drawerOpen}
        onClose={toggleDrawer}
        sx={{ "& .MuiDrawer-paper": { width: 250, boxSizing: "border-box" } }}
      >
        <Box
          role="presentation"
          onClick={isMobile ? toggleDrawer : undefined}
          onKeyDown={isMobile ? toggleDrawer : undefined}
        >
          <List>
            {MENU_ITEMS.map((item) => (
              <ListItem key={item.path} component={Link} to={item.path}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8,
          transition: muiTheme.transitions.create("margin", {
            easing: muiTheme.transitions.easing.sharp,
            duration: muiTheme.transitions.duration.leavingScreen,
          }),
          ml: !isMobile && drawerOpen ? "250px" : 0,
        }}
      >
        <Container sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3, md: 4 } }}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
}
