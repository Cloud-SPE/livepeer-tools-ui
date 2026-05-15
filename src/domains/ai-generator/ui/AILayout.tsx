import { useState } from "react";
import {
  AppBar,
  Box,
  Menu,
  MenuItem,
  Tab,
  Tabs,
  Toolbar,
  useTheme,
} from "@mui/material";
import ImageIcon from "@mui/icons-material/Image";
import AudiotrackIcon from "@mui/icons-material/Audiotrack";
import TravelExploreIcon from "@mui/icons-material/TravelExplore";
import LanguageIcon from "@mui/icons-material/Language";
import NetworkCheckIcon from "@mui/icons-material/NetworkCheck";
import SettingsIcon from "@mui/icons-material/Settings";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import CreateIcon from "@mui/icons-material/Create";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import SubtitlesIcon from "@mui/icons-material/Subtitles";
import RecordVoiceOverIcon from "@mui/icons-material/RecordVoiceOver";
import { Link as RouterLink, Outlet } from "react-router-dom";

interface ChildItem {
  text: string;
  icon: JSX.Element;
  path: string;
}

interface MenuItemDef {
  text: string;
  icon: JSX.Element;
  path?: string;
  children?: ChildItem[];
}

const MENU_ITEMS: ReadonlyArray<MenuItemDef> = [
  {
    text: "Image Tasks",
    icon: <ImageIcon />,
    children: [
      { text: "Text To Image", icon: <CreateIcon />, path: "text-to-image" },
      { text: "Image to Image", icon: <PhotoCameraIcon />, path: "image-to-image" },
      { text: "Image to Video", icon: <VideoLibraryIcon />, path: "image-to-video" },
      { text: "Image to Text", icon: <TextFieldsIcon />, path: "image-to-text" },
      { text: "Upscale", icon: <ZoomInIcon />, path: "upscale" },
    ],
  },
  {
    text: "Audio Tasks",
    icon: <AudiotrackIcon />,
    children: [
      { text: "Audio to Text", icon: <SubtitlesIcon />, path: "audio-to-text" },
      { text: "Text to Speech", icon: <RecordVoiceOverIcon />, path: "text-to-speech" },
    ],
  },
  { text: "SAM-2", icon: <TravelExploreIcon />, path: "segment-anything-2" },
  { text: "LLM", icon: <LanguageIcon />, path: "llm" },
  { text: "BYOC OpenAI", icon: <SmartToyIcon />, path: "byoc/openai" },
  { text: "Capabilities", icon: <NetworkCheckIcon />, path: "network-capabilities" },
  { text: "Settings", icon: <SettingsIcon />, path: "settings" },
];

export function AILayout(): JSX.Element {
  const theme = useTheme();
  const [anchors, setAnchors] = useState<Record<string, HTMLElement | null>>({});

  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      <AppBar position="static" sx={{ bgcolor: theme.palette.primary.main }}>
        <Toolbar>
          <Tabs
            value={false}
            textColor="inherit"
            indicatorColor="secondary"
            variant="scrollable"
            scrollButtons="auto"
            sx={{ flexGrow: 1 }}
          >
            {MENU_ITEMS.map((item) => {
              if (item.children) {
                const key = item.text;
                const anchor = anchors[key] ?? null;
                const open = Boolean(anchor);
                return [
                  <Tab
                    key={key}
                    icon={item.icon}
                    label={item.text}
                    onClick={(e) =>
                      setAnchors((prev) => ({ ...prev, [key]: e.currentTarget }))
                    }
                    sx={{ display: "flex", alignItems: "center" }}
                  />,
                  <Menu
                    key={`${key}-menu`}
                    anchorEl={anchor}
                    open={open}
                    onClose={() => setAnchors((prev) => ({ ...prev, [key]: null }))}
                    anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                    transformOrigin={{ vertical: "top", horizontal: "left" }}
                  >
                    {item.children.map((child) => (
                      <MenuItem
                        key={child.text}
                        component={RouterLink}
                        to={child.path}
                        onClick={() =>
                          setAnchors((prev) => ({ ...prev, [key]: null }))
                        }
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        {child.icon}
                        {child.text}
                      </MenuItem>
                    ))}
                  </Menu>,
                ];
              }
              return (
                <Tab
                  key={item.text}
                  icon={item.icon}
                  label={item.text}
                  component={RouterLink}
                  to={item.path ?? "."}
                />
              );
            })}
          </Tabs>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Outlet />
      </Box>
    </Box>
  );
}
