// src/pages/HomePage.js

import React from "react";
import { Box, Container, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #000428 0%, #004e92 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        textAlign: "center",
        px: 3,
      }}
    >
      <Container maxWidth="sm">
        <Typography variant="h3" fontWeight="bold" gutterBottom>
          Mental Health Assessment
        </Typography>

        <Typography variant="h6" sx={{ mb: 4, color: "#cfe7ff" }}>
          Check your Stress, Anxiety & Depression Levels
        </Typography>

        <Button
          variant="contained"
          sx={{
            backgroundColor: "#00e676",
            "&:hover": { backgroundColor: "#00c853" },
            fontWeight: "bold",
            px: 4,
            py: 1.5,
            borderRadius: "12px",
          }}
          onClick={() => navigate("/dassform")}
        >
          Start Assessment
        </Button>
      </Container>
    </Box>
  );
}
