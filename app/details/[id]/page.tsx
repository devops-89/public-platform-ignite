import { Suspense } from "react";
import EntryDetails from "../../../components/layouts/EntryDetails";
import { CircularProgress, Box } from "@mui/material";

export default function DetailsIdPage() {
  return (
    <Suspense fallback={
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress />
      </Box>
    }>
      <EntryDetails />
    </Suspense>
  );
}
