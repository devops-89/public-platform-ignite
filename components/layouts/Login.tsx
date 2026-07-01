"use client";

import { useAppTheme } from "@/context/ThemeContext";
import { PublicAuthControllers } from "@/api/publicAuthControllers";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Collapse,
  Container,
  IconButton,
  InputAdornment,
  Link,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useFormik } from "formik";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import * as Yup from "yup";
import { useSnackbar } from "@/context/SnackbarContext";

const Login = () => {
  const { colors } = useAppTheme();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { showSnackbar } = useSnackbar();

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: Yup.object({
      email: Yup.string().email("Please enter a valid email address.").required("Email is required"),
      password: Yup.string().required("Password is required"),
    }),
    onSubmit: async (values) => {
      setIsLoading(true);
      try {
        const result = await PublicAuthControllers.login(values);
        const token = result.data.data.accessToken;
        const refreshToken = result.data.data.refreshToken;
        const user = result.data.data.user;

        localStorage.setItem("publicUser", JSON.stringify(user));
        localStorage.setItem("publicAccessToken", token);
        if (refreshToken) {
          localStorage.setItem("refreshToken", refreshToken);
        }
        showSnackbar("Login successful!", "success");
        router.push("/gallery");
      } catch (err: any) {
        console.error("Login failed:", err);
        let errorMessage = err?.response?.data?.message || err.message || "Something went wrong";
        const lowerMsg = errorMessage.toLowerCase();
        if (lowerMsg.includes("password")) {
          errorMessage = "Incorrect password. Please try again.";
        } else if (lowerMsg.includes("email") || lowerMsg.includes("user") || lowerMsg.includes("not found")) {
          errorMessage = "Incorrect email. Please try again.";
        } else if (lowerMsg.includes("validation error") || lowerMsg.includes("invalid") || lowerMsg.includes("credential")) {
          errorMessage = "Invalid email or password. Please try again.";
        }
        showSnackbar(errorMessage, "error");
      } finally {
        setIsLoading(false);
      }
    },
  });

  const textFieldStyles = {
    "& .MuiOutlinedInput-root": {
      color: colors.TEXT_PRIMARY,
      "& fieldset": { borderColor: colors.BORDER },
      "&:hover fieldset": { borderColor: colors.PRIMARY },
      "&.Mui-focused fieldset": { borderColor: colors.PRIMARY },
    },
    "& .MuiInputLabel-root": { color: colors.TEXT_SECONDARY },
    "& .MuiInputLabel-root.Mui-focused": { color: colors.PRIMARY },
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)`,
        padding: 2,
        transition: "background 0.3s ease",
      }}
    >
      <Container maxWidth="sm">
        <form onSubmit={formik.handleSubmit}>
          <Paper
            elevation={0}
            sx={{
              padding: { xs: 4, md: 6 },
              borderRadius: 4,
              background: "rgba(255, 255, 255, 0.8)",
              backdropFilter: "blur(12px)",
              border: `1px solid ${colors.BORDER}`,
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
          >
            <Box sx={{ mb: 4, textAlign: "center" }}>
              <Typography
                variant="h4"
                component="h1"
                gutterBottom
                sx={{
                  fontWeight: 800,
                  color: colors.TEXT_PRIMARY,
                  letterSpacing: "-0.025em",
                }}
              >
                Welcome Back
              </Typography>
              <Typography variant="body1" sx={{ color: colors.TEXT_SECONDARY }}>
                Enter your credentials to access your account
              </Typography>
            </Box>

            {/* Dummy fields to intercept browser autofill */}
            <input type="text" name="fakeusernameremembered" style={{ position: 'absolute', opacity: 0, height: 0, width: 0, zIndex: -1 }} tabIndex={-1} autoComplete="username" />
            <input type="password" name="fakepasswordremembered" style={{ position: 'absolute', opacity: 0, height: 0, width: 0, zIndex: -1 }} tabIndex={-1} autoComplete="current-password" />

            <Box sx={{ mt: 1 }}>
              <TextField
                margin="normal"
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                variant="outlined"
                sx={textFieldStyles}
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
                autoComplete="new-password"
                slotProps={{ inputLabel: { shrink: true } }}
                placeholder="Enter your email"
              />
              <TextField
                margin="normal"
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                id="password"
                sx={textFieldStyles}
                autoComplete="new-password"
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          sx={{ color: colors.TEXT_SECONDARY }}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                  inputLabel: { shrink: true },
                }}
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.password && Boolean(formik.errors.password)}
                helperText={formik.touched.password && formik.errors.password}
                placeholder="Enter your password"
              />

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mt: 1,
                  mb: 2,
                }}
              >
                <Link
                  href="/forgot-password"
                  variant="body2"
                  sx={{
                    color: colors.PRIMARY,
                    textDecoration: "none",
                    fontWeight: 600,
                    "&:hover": { textDecoration: "underline" },
                  }}
                >
                  Forgot password?
                </Link>
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={isLoading}
                sx={{
                  mt: 3,
                  mb: 2,
                  py: 1.5,
                  bgcolor: colors.PRIMARY,
                  color: "white",
                  fontWeight: 600,
                  fontSize: "1rem",
                  textTransform: "none",
                  borderRadius: 2,
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    bgcolor: colors.PRIMARY,
                    opacity: 0.9,
                    transform: "translateY(-1px)",
                    boxShadow: `0 10px 15px -3px ${colors.PRIMARY}40`,
                  },
                  "&.Mui-disabled": {
                    bgcolor: colors.PRIMARY,
                    opacity: 0.7,
                    color: "white",
                  },
                }}
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>

              <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
                <Typography variant="body2" sx={{ color: colors.TEXT_SECONDARY }}>
                  Don't have an account?{" "}
                  <Typography
                    component="span"
                    variant="body2"
                    sx={{
                      color: colors.PRIMARY,
                      fontWeight: 600,
                      cursor: "pointer",
                      "&:hover": { textDecoration: "underline" },
                    }}
                    onClick={() => router.push("/")}
                  >
                    Sign up
                  </Typography>
                </Typography>
              </Box>
            </Box>
          </Paper>
        </form>
      </Container>
    </Box>
  );
};

export default Login;
