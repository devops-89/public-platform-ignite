import { Box } from "@mui/material";
import React from "react";

interface LayoutProviderProps {
  children: React.ReactNode;
  isFullWidth?: boolean;
}

const LayoutProvider = ({ children, isFullWidth }: LayoutProviderProps) => {
  return (
    <Box
      sx={{
        ml: 0,
        mt: isFullWidth ? 0 : "70px",
        px: 0,
        transition: "all 0.3s ease",
      }}
    >
      {children}
    </Box>
  );
};

export default LayoutProvider;
