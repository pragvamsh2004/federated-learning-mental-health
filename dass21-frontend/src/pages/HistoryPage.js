import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Divider,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function HistoryPage() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("dass_history")) || [];
    setHistory(stored.reverse());
  }, []);

  const handleClearHistory = () => {
    localStorage.removeItem("dass_history");
    setHistory([]);
  };

  const openReport = (entry) => {
    navigate("/result", { state: entry });
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0f24 0%, #001f3f 100%)",
        py: 5,
        color: "#fff",
      }}
    >
      <Container maxWidth="sm">
        <Typography
          variant="h4"
          textAlign="center"
          fontWeight="bold"
          sx={{
            mb: 3,
            color: "#00eaff",
            textShadow: "0 0 10px rgba(0, 238, 255, 0.4)"
          }}
        >
          Assessment History
        </Typography>

        {history.length === 0 ? (
          <Typography align="center" sx={{ opacity: 0.8 }}>
            No saved reports yet. Start an assessment to generate history!
          </Typography>
        ) : (
          <>
            {history.map((entry) => (
              <Card
                key={entry.id}
                sx={{
                  mb: 2,
                  p: 2,
                  background: "rgba(15, 31, 65, 0.9)",
                  border: "1px solid rgba(0, 207, 255, 0.4)",
                  borderRadius: "12px",
                  boxShadow: "0px 0px 12px rgba(0, 174, 255, 0.25)",
                  transition: "0.25s",
                  cursor: "pointer",
                  "&:hover": {
                    background: "rgba(20, 45, 90, 0.95)",
                    borderColor: "#00eaff",
                    transform: "scale(1.02)"
                  },
                }}
                onClick={() => openReport(entry)}
              >
                <CardContent>
                  <Typography
                    fontWeight="bold"
                    sx={{ color: "#00eaff", fontSize: "1.05rem" }}
                  >
                    {entry.date}
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{ color: "#d0eaff", mt: 0.5 }}
                  >
                    Stress: <strong>{entry.prediction.stress.level}</strong> •{" "}
                    Anxiety: <strong>{entry.prediction.anxiety.level}</strong> •{" "}
                    Depression: <strong>{entry.prediction.depression.level}</strong>
                  </Typography>
                </CardContent>
              </Card>
            ))}

            <Button
              fullWidth
              variant="outlined"
              sx={{
                mt: 3,
                color: "#ff4d4d",
                borderColor: "#ff4d4d",
                "&:hover": {
                  background: "rgba(255, 77, 77, 0.15)"
                },
              }}
              onClick={handleClearHistory}
            >
              Clear All History
            </Button>
          </>
        )}

        <Divider sx={{ my: 3, bgcolor: "#00eaff" }} />

        <Button
          fullWidth
          variant="contained"
          sx={{
            bgcolor: "#00eaff",
            color: "#000",
            fontWeight: "bold",
            borderRadius: "10px",
            "&:hover": { bgcolor: "#00bcd4" }
          }}
          onClick={() => navigate("/")}
        >
          Back to Home
        </Button>
      </Container>
    </Box>
  );
}
