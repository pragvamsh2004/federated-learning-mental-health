import React, { useEffect, useRef } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Divider,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";

import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

export default function ResultPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const prediction = location.state?.prediction;
  const input = location.state?.input; // for age/gender in filename

  const chartRef = useRef(null); // used only for PDF chart capture

  // ---- Save to history ----
  useEffect(() => {
    if (!prediction) return;
    const stored = JSON.parse(localStorage.getItem("dass_history")) || [];
    const entry = {
      id: Date.now(),
      date: new Date().toLocaleString(),
      prediction,
    };
    stored.push(entry);
    localStorage.setItem("dass_history", JSON.stringify(stored));
  }, [prediction]);

  if (!prediction) {
    return (
      <Box textAlign="center" p={5}>
        <Typography variant="h5" gutterBottom>
          No prediction data found.
        </Typography>
        <Button variant="contained" onClick={() => navigate("/")}>
          Go Home
        </Button>
      </Box>
    );
  }

  const stress = prediction.stress.score;
  const anxiety = prediction.anxiety.score;
  const depression = prediction.depression.score;

  const stressLevel = prediction.stress.level;
  const anxietyLevel = prediction.anxiety.level;
  const depressionLevel = prediction.depression.level;

  // ---- Severity colours (high-contrast clinical) ----
  const severityColor = (level) => {
    switch (level) {
      case "Normal":
        return "#4caf50"; // green
      case "Mild":
        return "#ffd54f"; // yellow
      case "Moderate":
        return "#ff9800"; // orange
      case "Severe":
        return "#f44336"; // red
      case "Extremely Severe":
        return "#b71c1c"; // dark red
      default:
        return "#90a4ae";
    }
  };

  // ---- Assessment summary messages ----
  const domainSummary = (name, level) => {
    switch (level) {
      case "Normal":
        return `${name} appears within a healthy range. You seem to be coping effectively with current demands.`;
      case "Mild":
        return `There are mild signs of ${name.toLowerCase()}, which are common during busy or stressful periods. Symptoms are present but still manageable.`;
      case "Moderate":
        return `${name} is in a moderate range, suggesting that symptoms may be affecting your daily routines or concentration at times.`;
      case "Severe":
        return `Your ${name.toLowerCase()} is in a severe range. Symptoms may be significantly affecting your mood, energy, or functioning.`;
      case "Extremely Severe":
        return `${name} is in a very high range. This level of symptoms can strongly impact wellbeing and usually requires timely professional support.`;
      default:
        return `No clear interpretation is available for ${name.toLowerCase()}.`;
    }
  };

  // ---- Personalized recommendations (tone C) ----
  const improvementSuggestions = (name, level) => {
    const lower = name.toLowerCase();
    switch (level) {
      case "Normal":
        return {
          intro: `Your ${lower} is currently in a healthy range. To maintain this level of wellbeing, you may benefit from:`,
          bullets: [
            "Keeping regular sleep and wake times.",
            "Maintaining balanced study/work and rest periods.",
            "Continuing positive habits that help you relax (music, walks, hobbies).",
          ],
        };
      case "Mild":
        return {
          intro: `There are mild signs of ${lower}. Small, consistent changes can help prevent these symptoms from increasing:`,
          bullets: [
            "Scheduling short breaks between tasks instead of working continuously.",
            "Practising simple breathing or brief mindfulness once or twice a day.",
            "Limiting screen time late at night and keeping a regular sleep schedule.",
          ],
        };
      case "Moderate":
        return {
          intro: `${name} is in a moderate range. It may help to actively build a structured self-care routine:`,
          bullets: [
            "Doing light physical activity (even 10–20 minutes of walking) most days of the week.",
            "Using a journal or notes app to track triggers, thoughts, and emotions.",
            "Talking openly with a trusted friend, family member, or mentor about how you feel.",
          ],
        };
      case "Severe":
        return {
          intro: `${name} is in a higher range. In addition to self-care, professional support is strongly recommended:`,
          bullets: [
            "Scheduling an appointment with a counselor, psychologist, or mental health professional.",
            "Creating a simple daily structure (wake time, meals, tasks, wind-down time).",
            "Reducing alcohol or substance use, if applicable, as these can worsen symptoms.",
          ],
        };
      case "Extremely Severe":
        return {
          intro: `${name} is in a very high range. Professional help is strongly advised as soon as possible:`,
          bullets: [
            "Reaching out to a qualified mental health professional for a detailed assessment.",
            "Sharing how you feel with someone you trust instead of managing everything alone.",
            "If you ever feel unable to cope or unsafe, seeking urgent support from local medical or mental health services.",
          ],
        };
      default:
        return {
          intro: `No specific guidance is available for ${lower}, but general wellbeing strategies may still be helpful:`,
          bullets: [
            "Maintaining regular meals and sleep.",
            "Staying connected with supportive people.",
          ],
        };
    }
  };

  const stressRec = improvementSuggestions("Stress", stressLevel);
  const anxietyRec = improvementSuggestions("Anxiety", anxietyLevel);
  const depressionRec = improvementSuggestions("Depression", depressionLevel);

  // ---- Pie chart data used for UI & PDF ----
  const pieData = {
    labels: ["Stress", "Anxiety", "Depression"],
    datasets: [
      {
        data: [stress, anxiety, depression],
        backgroundColor: [
          severityColor(stressLevel),
          severityColor(anxietyLevel),
          severityColor(depressionLevel),
        ],
        borderColor: "#ffffff",
        borderWidth: 2,
      },
    ],
  };

  const pieOptions = {
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((ctx.raw / total) * 100).toFixed(1);
            return `${ctx.label}: ${ctx.raw.toFixed(2)} (${percentage}%)`;
          },
        },
      },
      datalabels: {
        color: "#000",
        formatter: (value, ctx) => {
          const label = ctx.chart.data.labels[ctx.dataIndex];
          const total = ctx.chart.data.datasets[0].data.reduce(
            (a, b) => a + b,
            0
          );
          const percent = ((value / total) * 100).toFixed(0);
          return `${label}\n(${percent}%)`;
        },
        font: { weight: "bold", size: 13 },
        align: "center",
        anchor: "center",
      },
    },
  };

  const ScoreBlock = ({ title, score, level }) => (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle1" fontWeight="bold">
        {title}
      </Typography>
      <Typography variant="body2">
        Score (0–21): {score.toFixed(2)}
      </Typography>
      <Box
        sx={{
          mt: 0.6,
          display: "inline-block",
          px: 1.5,
          py: 0.4,
          fontSize: "0.8rem",
          fontWeight: "bold",
          borderRadius: "20px",
          color: "#000",
          backgroundColor: severityColor(level),
        }}
      >
        {level}
      </Box>
    </Box>
  );

  // ----------- PDF: clean white, clinical layout -----------
  const handleDownloadPdf = async () => {
    try {
      const doc = new jsPDF("p", "mm", "a4");
      const marginX = 15;
      const usableWidth = doc.internal.pageSize.getWidth() - marginX * 2;

      let y = 20;

      const addWrappedText = (text, x, yStart, maxWidth, lineHeight) => {
        const lines = doc.splitTextToSize(text, maxWidth);
        lines.forEach((line) => {
          if (y > 280) {
            doc.addPage();
            y = 20;
          }
          doc.text(line, x, y);
          y += lineHeight;
        });
        return y;
      };

      // Header
      doc.setFillColor(240, 240, 240);
      doc.rect(0, 0, doc.internal.pageSize.getWidth(), 18, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 60);
      doc.text(
        "Mental Wellness Assessment Report",
        doc.internal.pageSize.getWidth() / 2,
        12,
        { align: "center" }
      );

      // Meta info
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(40, 40, 40);
      y = 24;

      const dateStr = new Date().toLocaleString();
      let ageStr = input?.Q1_1 ? `Age: ${input.Q1_1}` : "";
      let genderStr = "";
      if (input?.Q1_2 === 1) genderStr = "Gender: Male";
      else if (input?.Q1_2 === 2) genderStr = "Gender: Female";

      const metaLine = [ageStr, genderStr, `Report Date: ${dateStr}`]
        .filter(Boolean)
        .join("   |   ");

      if (metaLine) {
        doc.text(metaLine, marginX, y);
        y += 6;
      }

      y = addWrappedText(
        "This report summarises your current stress, anxiety, and depression levels based on your responses to the DASS-21 questionnaire. Scores range from 0 to 21 in each domain; higher scores indicate higher symptom severity.",
        marginX,
        y,
        usableWidth,
        5
      );

      // SECTION: Assessment Summary
      y += 4;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 80);
      doc.text("Assessment Summary", marginX, y);
      y += 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(40, 40, 40);

      y = addWrappedText(
        `Stress: ${domainSummary("Stress", stressLevel)}`,
        marginX,
        y,
        usableWidth,
        5
      );
      y = addWrappedText(
        `Anxiety: ${domainSummary("Anxiety", anxietyLevel)}`,
        marginX,
        y,
        usableWidth,
        5
      );
      y = addWrappedText(
        `Depression: ${domainSummary("Depression", depressionLevel)}`,
        marginX,
        y,
        usableWidth,
        5
      );

      // SECTION: Symptom Severity Profile
      y += 4;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 80);
      doc.text("Symptom Severity Profile (0–21)", marginX, y);
      y += 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(40, 40, 40);

      const rowHeight = 6;
      const makeRow = (label, score, level) => {
        if (y > 275) {
          doc.addPage();
          y = 20;
        }
        doc.text(`${label}`, marginX, y);
        doc.text(`Score: ${score.toFixed(2)} / 21`, marginX + 45, y);
        doc.text(`Level: ${level}`, marginX + 100, y);
        y += rowHeight;
      };

      makeRow("Stress", stress, stressLevel);
      makeRow("Anxiety", anxiety, anxietyLevel);
      makeRow("Depression", depression, depressionLevel);

      // SECTION: Personalized Recommendations
      const writeRecSection = (title, recObj) => {
        y += 4;
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 80);
        doc.text(title, marginX, y);
        y += 5;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(40, 40, 40);

        y = addWrappedText(recObj.intro, marginX, y, usableWidth, 5);

        recObj.bullets.forEach((b) => {
          if (y > 275) {
            doc.addPage();
            y = 20;
          }
          const bulletText = doc.splitTextToSize(`• ${b}`, usableWidth);
          bulletText.forEach((line) => {
            doc.text(line, marginX, y);
            y += 5;
          });
        });
      };

      y += 4;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 80);
      doc.text("Personalized Recommendations", marginX, y);
      y += 4;

      writeRecSection("Stress", stressRec);
      writeRecSection("Anxiety", anxietyRec);
      writeRecSection("Depression", depressionRec);

      // Disclaimer at bottom of last page
      if (y > 260) {
        doc.addPage();
        y = 20;
      }
      y += 4;
      doc.setDrawColor(180, 180, 180);
      doc.line(marginX, y, marginX + usableWidth, y);
      y += 5;

      doc.setFontSize(8);
      doc.setTextColor(90, 90, 90);
      y = addWrappedText(
        "This document is intended for wellbeing support and does not replace a clinical diagnosis or treatment. If you feel distressed, overwhelmed, or unable to cope, please seek help from a qualified mental health professional or local medical services.",
        marginX,
        y,
        usableWidth,
        4
      );

      // PAGE 2: Pie chart (optional visual)
      if (chartRef.current) {
        const canvasElem = chartRef.current.querySelector("canvas");
        if (canvasElem) {
          const chartCanvas = await html2canvas(canvasElem, {
            backgroundColor: "#ffffff",
            scale: 2,
          });
          const imgData = chartCanvas.toDataURL("image/png");
          doc.addPage();
          doc.setFont("helvetica", "bold");
          doc.setFontSize(12);
          doc.setTextColor(0, 0, 0);
          doc.text("Symptom Severity Pie Chart (0–21)", marginX, 20);

          const chartScale = 0.55;
          const imgWidth = usableWidth * chartScale;
          const imgHeight =
            (chartCanvas.height * imgWidth) / chartCanvas.width;
          const xCenter =
            (doc.internal.pageSize.getWidth() - imgWidth) / 2;
          doc.addImage(imgData, "PNG", xCenter, 30, imgWidth, imgHeight);
        }
      }

      // ------- Filename (Age + Gender + Date) -------
      const dateIso = new Date().toISOString().slice(0, 10);

      // Age: from Q1_1 if present
      let agePart = "";
      if (input && input.Q1_1 !== undefined && input.Q1_1 !== null && input.Q1_1 !== "") {
        agePart = `_Age${input.Q1_1}`;
      }

      // Gender: handle both number and string "1"/"2"
      let genderPart = "";
      if (input && input.Q1_2 !== undefined && input.Q1_2 !== null) {
        const g = String(input.Q1_2);
        if (g === "1") genderPart = "_Male";
        else if (g === "2") genderPart = "_Female";
      }

      const filename = `Mental_Wellness_Report${agePart}${genderPart}_${dateIso}.pdf`;
      doc.save(filename);
    } catch (err) {
      console.error("PDF generation error:", err);
      alert("Unable to generate PDF. Please try again.");
    }
  };

  // ------------- UI (same clinical card as before) -------------
  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0f24 0%, #001f3f 100%)",
        py: 5,
      }}
    >
      <Container maxWidth="md">
        <Card
          sx={{
            background: "linear-gradient(180deg, #0f1b33, #00142c)",
            color: "#fff",
            p: 4,
            borderRadius: "16px",
            boxShadow: "0px 0px 24px rgba(0, 191, 255, 0.25)",
          }}
        >
          <CardContent>
            {/* TITLE + EXPLANATION */}
            <Typography
              variant="h4"
              fontWeight="bold"
              align="center"
              gutterBottom
              sx={{
                color: "#00bfff",
                textShadow: "0 0 14px rgba(0,191,255,0.6)",
              }}
            >
              Mental Wellness Assessment Report
            </Typography>

            <Typography
              variant="body2"
              align="center"
              sx={{ mb: 3, color: "#cfd8dc" }}
            >
              This report summarises your current stress, anxiety, and
              depression levels based on your DASS-21 responses. Scores range
              from 0 to 21 in each domain; higher scores indicate higher symptom
              severity.
            </Typography>

            {/* SECTION 1: Assessment Summary */}
            <Typography
              variant="h6"
              fontWeight="bold"
              sx={{ mb: 1.5, mt: 1 }}
            >
              Assessment Summary
            </Typography>
            <Typography variant="body2" sx={{ mb: 0.8 }}>
              {domainSummary("Stress", stressLevel)}
            </Typography>
            <Typography variant="body2" sx={{ mb: 0.8 }}>
              {domainSummary("Anxiety", anxietyLevel)}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1.5 }}>
              {domainSummary("Depression", depressionLevel)}
            </Typography>

            <Divider sx={{ my: 2, bgcolor: "#0088ff" }} />

            {/* SECTION 2: Symptom Severity Profile */}
            <Typography
              variant="h6"
              fontWeight="bold"
              sx={{ mb: 1 }}
            >
              Symptom Severity Profile (0–21)
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" },
                gap: 2,
                mb: 2,
              }}
            >
              <ScoreBlock
                title="Stress"
                score={stress}
                level={stressLevel}
              />
              <ScoreBlock
                title="Anxiety"
                score={anxiety}
                level={anxietyLevel}
              />
              <ScoreBlock
                title="Depression"
                score={depression}
                level={depressionLevel}
              />
            </Box>

            <Divider sx={{ my: 2, bgcolor: "#0088ff" }} />

            {/* SECTION 3: Personalized Recommendations */}
            <Typography
              variant="h6"
              fontWeight="bold"
              sx={{ mb: 1 }}
            >
              Personalized Recommendations
            </Typography>

            {/* Stress */}
            <Box sx={{ mb: 1.5 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                Stress
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                {stressRec.intro}
              </Typography>
              <ul style={{ marginTop: 0, paddingLeft: "1.2rem" }}>
                {stressRec.bullets.map((b, idx) => (
                  <li key={idx}>
                    <Typography variant="body2">{b}</Typography>
                  </li>
                ))}
              </ul>
            </Box>

            {/* Anxiety */}
            <Box sx={{ mb: 1.5 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                Anxiety
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                {anxietyRec.intro}
              </Typography>
              <ul style={{ marginTop: 0, paddingLeft: "1.2rem" }}>
                {anxietyRec.bullets.map((b, idx) => (
                  <li key={idx}>
                    <Typography variant="body2">{b}</Typography>
                  </li>
                ))}
              </ul>
            </Box>

            {/* Depression */}
            <Box sx={{ mb: 1.5 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                Depression
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                {depressionRec.intro}
              </Typography>
              <ul style={{ marginTop: 0, paddingLeft: "1.2rem" }}>
                {depressionRec.bullets.map((b, idx) => (
                  <li key={idx}>
                    <Typography variant="body2">{b}</Typography>
                  </li>
                ))}
              </ul>
            </Box>

            {/* Disclaimer */}
            <Typography
              variant="caption"
              display="block"
              align="center"
              sx={{ color: "#b0bec5", mt: 2 }}
            >
              ⚕ This report is for wellbeing support and does not replace a
              clinical diagnosis. If you feel distressed, overwhelmed, or
              unable to cope, please seek help from a qualified mental health
              professional or local medical services.
            </Typography>

            {/* PIE CHART FOR UI + PDF */}
            <Box ref={chartRef} sx={{ mt: 4 }}>
              <Typography
                variant="h6"
                fontWeight="bold"
                sx={{ mb: 1 }}
                align="center"
              >
                Symptom Severity Distribution
              </Typography>
              <Box
                sx={{
                  mb: 2,
                  width: "300px",
                  height: "300px",
                  mx: "auto",
                }}
              >
                <Pie data={pieData} options={pieOptions} />
              </Box>
            </Box>

            {/* ACTION BUTTONS */}
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 2,
                mt: 3,
              }}
            >
              <Button
                fullWidth
                variant="contained"
                sx={{
                  bgcolor: "#00e676",
                  color: "#000",
                  fontWeight: "bold",
                  borderRadius: "999px",
                }}
                onClick={() => navigate("/")}
              >
                Back to Home
              </Button>

              <Button
                fullWidth
                variant="contained"
                sx={{
                  bgcolor: "#2196f3",
                  color: "#fff",
                  fontWeight: "bold",
                  borderRadius: "999px",
                }}
                onClick={handleDownloadPdf}
              >
                Download Clinical Report (PDF)
              </Button>

              <Button
                fullWidth
                variant="outlined"
                sx={{
                  borderColor: "#00b4ff",
                  color: "#00b4ff",
                  borderRadius: "999px",
                }}
                onClick={() => navigate("/history")}
              >
                View Previous Reports
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
