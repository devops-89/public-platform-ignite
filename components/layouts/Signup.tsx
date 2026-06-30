"use client";

import { useSnackbar } from "@/context/SnackbarContext";
import { useAppTheme } from "@/context/ThemeContext";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import {
  Box,
  Button,
  Container,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useFormik } from "formik";
import { useRouter } from "next/navigation";
import { useState } from "react";
import * as Yup from "yup";
import { PublicAuthControllers } from "../../api/publicAuthControllers";

const validationSchema = Yup.object({
  fullName: Yup.string()
    .matches(/^[A-Za-z\s]+$/, "Full Name can only contain letters and spaces")
    .required("Full Name is required"),
  email: Yup.string()
    .email("Enter a valid email")
    .required("Email is required"),
  password: Yup.string().min(8, "Password should be of minimum 8 characters length").required("Password is required"),
});

export default function Signup() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const { showSnackbar } = useSnackbar();
  const [showPassword, setShowPassword] = useState(false);

  const formik = useFormik({
    initialValues: {
      fullName: "",
      email: "",
      password: "",
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      try {
        const response = await PublicAuthControllers.createPublicUser(values);
        
        if (response.status === 201 || response.data?.message) {
          showSnackbar("You registered successfully. Please verify OTP.", "success");
          // Redirect to verify-otp page with email in query params
          setTimeout(() => {
          router.push(`/verify-otp?email=${encodeURIComponent(values.email)}`);
          }, 1500);
        }
      } catch (error: unknown) {
        showSnackbar((error as { response?: { data?: { message?: string } } }).response?.data?.message || "An error occurred during signup.", "error");
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
        padding: 2,
        bgcolor: "background.default",
      }}
    >
      <Container component="main" maxWidth="sm">
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
                Create an Account
              </Typography>
              <Typography variant="body1" sx={{ color: colors.TEXT_SECONDARY }}>
                Register to participate in public voting
              </Typography>
            </Box>

            {/* Dummy fields to intercept browser autofill */}
            <input type="text" name="fakeusernameremembered" style={{ position: 'absolute', opacity: 0, height: 0, width: 0, zIndex: -1 }} tabIndex={-1} autoComplete="username" />
            <input type="password" name="fakepasswordremembered" style={{ position: 'absolute', opacity: 0, height: 0, width: 0, zIndex: -1 }} tabIndex={-1} autoComplete="current-password" />

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="fullName"
                label="Full Name"
                name="fullName"
                autoComplete="name"
                autoFocus
                sx={textFieldStyles}
                value={formik.values.fullName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.fullName && Boolean(formik.errors.fullName)}
                helperText={formik.touched.fullName && formik.errors.fullName as string}
                placeholder="Enter your full name"
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                sx={textFieldStyles}
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email as string}
                placeholder="Enter your email"
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                id="password"
                autoComplete="new-password"
                sx={textFieldStyles}
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.password && Boolean(formik.errors.password)}
                helperText={formik.touched.password && formik.errors.password as string}
                placeholder="Enter your password"
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
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
              />



              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={formik.isSubmitting}
                sx={{
                  mt: 2,
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
                {formik.isSubmitting ? "Creating Account..." : "Sign Up"}
              </Button>

              <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
                <Typography variant="body2" sx={{ color: colors.TEXT_SECONDARY }}>
                  Already have an account?{" "}
                  <Typography
                    component="span"
                    variant="body2"
                    sx={{
                      color: colors.PRIMARY,
                      fontWeight: 600,
                      cursor: "pointer",
                      "&:hover": { textDecoration: "underline" },
                    }}
                    onClick={() => router.push("/login")}
                  >
                    Sign in
                  </Typography>
                </Typography>
              </Box>
            </Box>
          </Paper>
        </form>
      </Container>
    </Box>
  );
}
