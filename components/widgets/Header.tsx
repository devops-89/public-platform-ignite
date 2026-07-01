"use client";
import { useAppTheme } from "@/context/ThemeContext";
import { LogoutOutlined } from "@mui/icons-material";
import { Avatar, Box, Button, Paper, Tooltip, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import LayoutProvider from "./Layout-Provider";
import { PublicAuthControllers } from "@/api/publicAuthControllers";

import { useSnackbar } from "@/context/SnackbarContext";

const Header = () => {
  const { colors } = useAppTheme();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userName, setUserName] = useState("Public Voter");
  const [userEmail, setUserEmail] = useState("");
  const router = useRouter();
  const [userAvatar, setUserAvatar] = useState("");
  const { showSnackbar } = useSnackbar();

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken") || "";
      await PublicAuthControllers.logout({ refreshToken });
    } catch (err) {
      console.error("Logout API failed, continuing with local cleanup...", err);
    }
    
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("publicAccessToken");
    localStorage.removeItem("publicUser");
    localStorage.removeItem("publicRefreshToken");
    showSnackbar("Logged out successfully!", "success");
    router.push("/login");
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);

    const fetchUserData = async () => {
      try {
        const userStr = localStorage.getItem("user");
        if (userStr) {
           const localUser = JSON.parse(userStr);
           if (localUser.email) setUserEmail(localUser.email);
           if (localUser.fullName) {
             setUserName(localUser.fullName);
           } else if (localUser.firstName || localUser.lastName) {
             setUserName(`${localUser.firstName || ""} ${localUser.lastName || ""}`.trim());
           } else if (localUser.name) {
             setUserName(localUser.name);
           }
        }
      } catch (error) {
        console.error("Failed to fetch user details for header", error);
      }
    };

    fetchUserData();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <LayoutProvider>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          position: "fixed",
          top: 0,
          right: 0,
          left: 0,
          zIndex: 1000,
          height: 70,
          px: { xs: 3, md: 5 },
          transition:
            "background 0.3s ease, backdrop-filter 0.3s ease, box-shadow 0.3s ease",
          ...(scrolled
            ? {
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                bgcolor: `${colors.BACKGROUND}cc`,
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                borderBottom: `1px solid ${colors.BORDER}`,
              }
            : {
                bgcolor: colors.BACKGROUND,
                borderBottom: `1px solid ${colors.BORDER}`,
              }),
        }}
      >
        {/* Left Side: Title */}
        <Typography variant="h6" sx={{ fontWeight: 700, color: colors.TEXT_PRIMARY }}>
          Ignite Innovation
        </Typography>

        {/* Right Side: Settings Icon (Commented) and Avatar */}
        {/* <Tooltip title="Settings">
          <IconButton
            size="small"
            sx={{
              color: colors.TEXT_SECONDARY,
              "&:hover": { color: colors.TEXT_PRIMARY, bgcolor: colors.BORDER },
            }}
          >
            <Settings fontSize="small" />
          </IconButton>
        </Tooltip> */}
        {/* Profile Avatar with gradient ring and hover menu */}
        <Box
          onMouseEnter={() => setMenuOpen(true)}
          onMouseLeave={() => setMenuOpen(false)}
          sx={{ position: "relative", py: 1 }}
        >
          <Tooltip title="My Profile">
            <Box
              sx={{
                p: "2px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #f06, #a855f7, #3b82f6)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                "&:hover": { opacity: 0.9 },
                transition: "opacity 0.2s ease",
              }}
            >
              <Avatar
                src={userAvatar || undefined}
                sx={{
                  width: 34,
                  height: 34,
                  border: `2px solid ${colors.BACKGROUND}`,
                  bgcolor: !userAvatar ? colors.PRIMARY : undefined,
                  color: !userAvatar ? "#fff" : undefined,
                  fontSize: 16,
                  fontWeight: "bold",
                }}
              >
                {!userAvatar && userName ? userName.charAt(0).toUpperCase() : null}
              </Avatar>
            </Box>
          </Tooltip>

          {/* Hover Menu */}
          <Box
            sx={{
              position: "absolute",
              top: "100%",
              right: 0,
              pt: 0.5, // gap
              opacity: menuOpen ? 1 : 0,
              visibility: menuOpen ? "visible" : "hidden",
              transform: menuOpen ? "translateY(0)" : "translateY(-10px)",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              zIndex: 1100,
            }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 2,
                minWidth: 100,
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                bgcolor: `${colors.BACKGROUND}e6`,
                borderRadius: 3,
                boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                border: `1px solid ${colors.BORDER}`,
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1.5 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: colors.TEXT_PRIMARY }}>
                    {userName}
                  </Typography>
                  {userEmail && (
                    <Typography variant="caption" sx={{ color: colors.TEXT_SECONDARY, display: "block" }}>
                      {userEmail}
                    </Typography>
                  )}
                </Box>
              </Box>

              <Button
                variant="text"
                color="error"
                startIcon={<LogoutOutlined />}
                onClick={handleLogout}
                sx={{
                  justifyContent: "flex-start",
                  px: 1.5,
                  py: 1,
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 500,
                  color: "#ef4444",
                  "&:hover": {
                    bgcolor: "rgba(239, 68, 68, 0.08)",
                  },
                }}
              >
                Logout
              </Button>
            </Paper>
          </Box>
        </Box>
      </Box>
    </LayoutProvider>
  );
};

export default Header;
