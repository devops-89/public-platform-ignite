import VerifyOtp from "../../components/layouts/VerifyOtp";
import { Suspense } from "react";

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyOtp />
    </Suspense>
  );
}
