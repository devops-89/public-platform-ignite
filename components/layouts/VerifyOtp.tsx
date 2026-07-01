"use client";

import React, { useEffect, useRef, useState } from "react";
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
import { useRouter, useSearchParams } from "next/navigation";
import * as Yup from "yup";

import { useSnackbar } from "@/context/SnackbarContext";
import { useAppTheme } from "@/context/ThemeContext";
import { PublicAuthControllers } from "../../api/publicAuthControllers";

export default function VerifyOtp() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const flow = searchParams.get("flow");
  const { showSnackbar } = useSnackbar();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [cooldown, setCooldown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0 && !canResend) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    } else if (cooldown === 0) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [cooldown, canResend]);

  const handleResendOtp = async () => {
    if (!email) return;
    try {
      setLoading(true);
      await PublicAuthControllers.resendOtp({ email });
      showSnackbar("Verification code resent successfully.", "success");
      setCooldown(60);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err: unknown) {
      console.error(err);
      const error = err as { response?: { data?: { message?: string } }, message?: string };
      showSnackbar(error?.response?.data?.message || error?.message || "Failed to resend OTP.", "error");
    } finally {
      setLoading(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Focus the first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;

    const newOtp = [...otp];
    // Allow pasting full 6 digits
    if (value.length === 6) {
      const chars = value.split("");
      for (let i = 0; i < 6; i++) {
        newOtp[i] = chars[i] || "";
      }
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
      return;
    }

    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Move to next input if value is entered
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      // Move to previous input on backspace
      inputRefs.current[index - 1]?.focus();
    }
  };

  const formik = useFormik({
    initialValues: {
      password: "",
      confirmPassword: "",
    },
    validationSchema: flow === "forgot" ? Yup.object({
      password: Yup.string()
        .min(8, "Password must be at least 8 characters")
        .matches(/[A-Z]/, "Password must include at least one uppercase letter")
        .matches(/[a-z]/, "Password must include at least one lowercase letter")
        .matches(/[0-9]/, "Password must include at least one number")
        .matches(
          /[!@#$%^&*(),.?":{}|<>]/,
          "Password must include at least one special character",
        )
        .required("Please Enter Password"),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref("password")], "Passwords must match")
        .required("Please Confirm Your Password"),
    }) : Yup.object({}),

    onSubmit: async (values) => {
      const otpValue = otp.join("");
      
      if (otpValue.length !== 6) {
        showSnackbar("Please enter all 6 digits of the OTP.", "error");
        return;
      }

      if (flow === "forgot") {
        try {
          setLoading(true);
          const response = await PublicAuthControllers.resetPassword({
            email: email || "",
            otp: otpValue,
            password: values.password,
          });

          showSnackbar(
            response?.data?.message || "Password reset successfully!",
            "success"
          );

          setTimeout(() => {
            router.push("/login");
          }, 1000);
        } catch (err: unknown) {
          console.error(err);
          const error = err as { response?: { data?: { message?: string } }, message?: string };
          showSnackbar(error?.response?.data?.message || error?.message || "Failed to reset password.", "error");
        } finally {
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);

        const payload = {
          email: email || "",
          otp: otpValue
        };

        const res = await PublicAuthControllers.verifyPublicOtp(payload);
        showSnackbar("Your account has been activated successfully.", "success");
        
        // Store token if returned
        const token = res?.data?.data?.accessToken || res?.data?.accessToken || res?.data?.data?.token || res?.data?.token;
        const refreshToken = res?.data?.data?.refreshToken || res?.data?.refreshToken;
        if (token) {
          localStorage.setItem("accessToken", token);
          localStorage.setItem("publicAccessToken", token);
        }
        if (refreshToken) {
          localStorage.setItem("refreshToken", refreshToken);
        }

        const userData = res?.data?.data?.user || res?.data?.user;
        if (userData) {
          localStorage.setItem("user", JSON.stringify(userData));
          localStorage.setItem("publicUser", JSON.stringify(userData));
        }
        
        router.push("/gallery");
      } catch (err: unknown) {
        console.error(err);
        const error = err as { response?: { data?: { message?: string } }, message?: string };
        let errorMessage = error?.response?.data?.message || error?.message || "";
        if (!errorMessage || errorMessage.toLowerCase().includes("invalid") || errorMessage.toLowerCase().includes("otp")) {
            errorMessage = "Invalid OTP. Please enter the correct verification code.";
        }
        showSnackbar(errorMessage, "error");
      } finally {
        setLoading(false);
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
              textAlign: "center",
            }}
          >
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              sx={{
                fontWeight: 800,
                color: colors.TEXT_PRIMARY,
                letterSpacing: "-0.025em",
                mb: 1
              }}
            >
              {flow === "forgot" ? "Reset Password" : "Verify Your Email"}
            </Typography>
            <Typography variant="body1" sx={{ color: colors.TEXT_SECONDARY, mb: 4 }}>
              We sent a 6-digit verification code to<br />
              <strong>{email || "your email"}</strong>
            </Typography>

            <Box sx={{ display: "flex", justifyContent: "center", gap: 1, mb: 4 }}>
              {otp.map((digit, index) => (
                <TextField
                  key={index}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  inputRef={(el) => { inputRefs.current[index] = el; }}
                  variant="outlined"
                  sx={{
                    width: { xs: "40px", sm: "50px" },
                    "& .MuiOutlinedInput-root": {
                      fontSize: "1.5rem",
                      fontWeight: "bold",
                      textAlign: "center",
                      color: colors.PRIMARY,
                      "& fieldset": { borderColor: colors.BORDER },
                      "&:hover fieldset": { borderColor: colors.PRIMARY },
                      "&.Mui-focused fieldset": { borderColor: colors.PRIMARY, borderWidth: "2px" },
                    },
                    "& input": {
                      textAlign: "center",
                      p: { xs: 1.5, sm: 2 },
                    }
                  }}
                  slotProps={{
                    htmlInput: {
                      maxLength: 6, // to allow pasting 6 digits
                      inputMode: "numeric"
                    }
                  }}
                />
              ))}
            </Box>

            {flow === "forgot" && (
              <Box sx={{ mt: 4, textAlign: "left" }}>
                {/* Dummy fields to intercept browser autofill */}
                <input type="text" name="fakeusernameremembered" style={{ position: 'absolute', opacity: 0, height: 0, width: 0, zIndex: -1 }} tabIndex={-1} autoComplete="username" />
                <input type="password" name="fakepasswordremembered" style={{ position: 'absolute', opacity: 0, height: 0, width: 0, zIndex: -1 }} tabIndex={-1} autoComplete="current-password" />

                <TextField
                  fullWidth margin="normal" label="New Password" name="password" type={showPassword ? "text" : "password"} sx={textFieldStyles} autoComplete="new-password"
                  value={formik.values.password} onChange={formik.handleChange} onBlur={formik.handleBlur}
                  error={formik.touched.password && Boolean(formik.errors.password)}
                  helperText={formik.touched.password && formik.errors.password as string}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
                <TextField
                  fullWidth margin="normal" label="Confirm Password" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} sx={textFieldStyles} autoComplete="new-password"
                  value={formik.values.confirmPassword} onChange={formik.handleChange} onBlur={formik.handleBlur}
                  error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
                  helperText={formik.touched.confirmPassword && formik.errors.confirmPassword as string}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Box>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading || otp.join("").length !== 6 || !email}
              sx={{
                py: 1.5,
                mt: flow === "forgot" ? 4 : 0,
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
              {loading ? (flow === "forgot" ? "Resetting..." : "Verifying...") : (flow === "forgot" ? "Reset Password" : "Verify OTP")}
            </Button>
            
            <Box sx={{ mt: 3, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
              <Typography variant="body2" sx={{ color: colors.TEXT_SECONDARY }}>
                Didn&apos;t receive the code?{" "}
                <Button
                  variant="text"
                  sx={{ textTransform: "none", p: 0, minWidth: "auto", fontWeight: 600, color: colors.PRIMARY }}
                  onClick={handleResendOtp}
                  disabled={!canResend || loading}
                >
                  {canResend ? "Resend Verification Code" : `Resend in ${formatTimer(cooldown)}`}
                </Button>
              </Typography>
              <Button
                variant="text"
                sx={{ textTransform: "none", p: 0, minWidth: "auto", fontWeight: 600, color: colors.TEXT_SECONDARY }}
                onClick={() => router.push("/")}
              >
                Go Back
              </Button>
            </Box>
          </Paper>
        </form>
      </Container>
    </Box>
  );
}
