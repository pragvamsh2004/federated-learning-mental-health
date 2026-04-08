import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  Divider,
  TextField,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  FormHelperText,
  Select,
  InputLabel,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// -------------------- Question Definitions --------------------

// Demographics (Q1_1 to Q1_6)
const demographicFields = [
  {
    key: "Q1_1",
    label: "Age",
    type: "number",
    helper: "Recommended for 16+ years, but younger users can still use this tool.",
  },
  {
    key: "Q1_2",
    label: "Gender",
    type: "select",
    options: [
      { value: 1, label: "Male" },
      { value: 2, label: "Female" },
    ],
  },
  {
    key: "Q1_3",
    label: "Marital Status",
    type: "select",
    options: [
      { value: 0, label: "No" },
      { value: 1, label: "Yes" },
    ],
  },
  {
    key: "Q1_4",
    label: "Educational Status",
    type: "select",
    options: [
      { value: 1, label: "Illiterate" },
      { value: 2, label: "Primary" },
      { value: 3, label: "SSC" },
      { value: 4, label: "HSC" },
      { value: 5, label: "Graduation and above" },
    ],
  },
  {
    key: "Q1_5",
    label: "Occupational Status",
    type: "select",
    options: [
      { value: 1, label: "Housewife" },
      { value: 2, label: "Service" },
      { value: 3, label: "Business" },
      { value: 4, label: "Student" },
      { value: 5, label: "Day labour" },
      { value: 6, label: "Unemployed" },
    ],
  },
  {
    key: "Q1_6",
    label: "Sleeping Problem",
    type: "select",
    options: [
      { value: 0, label: "No" },
      { value: 1, label: "Yes" },
    ],
  },
];

// Stress (S1–S7) mapped to Q3_1_S1 ... Q3_7_S7
const stressQuestions = [
  {
    key: "Q3_1_S1",
    code: "S1",
    text: "I found it difficult to relax.",
  },
  {
    key: "Q3_2_S2",
    code: "S2",
    text: "I felt I reacted too strongly to situations.",
  },
  {
    key: "Q3_3_S3",
    code: "S3",
    text: "I felt I was using a lot of nervous energy.",
  },
  {
    key: "Q3_4_S4",
    code: "S4",
    text: "I noticed myself becoming easily agitated or frustrated.",
  },
  {
    key: "Q3_5_S5",
    code: "S5",
    text: "I found it hard to calm down once I was upset.",
  },
  {
    key: "Q3_6_S6",
    code: "S6",
    text: "I felt impatient with things that slowed me down.",
  },
  {
    key: "Q3_7_S7",
    code: "S7",
    text: "I felt more touchy or easily irritated than usual.",
  },
];

// Anxiety (A1–A7) mapped to Q3_8_A1 ... Q3_14_A7
const anxietyQuestions = [
  {
    key: "Q3_8_A1",
    code: "A1",
    text: "I noticed physical signs of nervousness (e.g., dry mouth, tension).",
  },
  {
    key: "Q3_9_A2",
    code: "A2",
    text: "I felt short of breath or had difficulty breathing without exertion.",
  },
  {
    key: "Q3_10_A3",
    code: "A3",
    text: "I noticed trembling or shakiness in my body.",
  },
  {
    key: "Q3_11_A4",
    code: "A4",
    text: "I worried about losing control or embarrassing myself in front of others.",
  },
  {
    key: "Q3_12_A5",
    code: "A5",
    text: "I felt I was close to panicking.",
  },
  {
    key: "Q3_13_A6",
    code: "A6",
    text: "I became very aware of my heart beating fast or irregularly.",
  },
  {
    key: "Q3_14_A7",
    code: "A7",
    text: "I felt scared or afraid without a clear reason.",
  },
];

// Depression (D1–D7) mapped to Q3_15_D1 ... Q3_21_D7
const depressionQuestions = [
  {
    key: "Q3_15_D1",
    code: "D1",
    text: "I found it hard to feel positive or cheerful.",
  },
  {
    key: "Q3_16_D2",
    code: "D2",
    text: "I lacked the drive or motivation to start things.",
  },
  {
    key: "Q3_17_D3",
    code: "D3",
    text: "I felt there was nothing in the future to look forward to.",
  },
  {
    key: "Q3_18_D4",
    code: "D4",
    text: "I felt low, down-hearted, or sad.",
  },
  {
    key: "Q3_19_D5",
    code: "D5",
    text: "I found it difficult to feel interested or enthusiastic about anything.",
  },
  {
    key: "Q3_20_D6",
    code: "D6",
    text: "I felt I was not a valuable or worthwhile person.",
  },
  {
    key: "Q3_21_D7",
    code: "D7",
    text: "I felt that life had lost its meaning or purpose.",
  },
];

const steps = ["Personal Info", "Stress", "Anxiety", "Depression"];

// DASS Response Scale
const scaleOptions = [
  { value: 0, label: "Never (0)" },
  { value: 1, label: "Sometimes (1)" },
  { value: 2, label: "Often (2)" },
  { value: 3, label: "Almost Always (3)" },
];

export default function DassForm() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [ageWarning, setAgeWarning] = useState("");

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeStep]);

  const updateAnswer = (key, rawValue) => {
    const value = rawValue === "" ? "" : Number(rawValue);
    setAnswers((prev) => ({ ...prev, [key]: value }));

    if (key === "Q1_1") {
      if (value && (value < 16 || value > 60)) {
        setAgeWarning(
          "Note: This tool is recommended for individuals aged 16–60, but your responses will still be processed."
        );
      } else {
        setAgeWarning("");
      }
    }
  };

  const isDemographicsComplete = () => {
    return demographicFields.every(
      (field) => answers[field.key] !== undefined && answers[field.key] !== ""
    );
  };

  const areQuestionsComplete = (questionList) => {
    return questionList.every(
      (q) => answers[q.key] !== undefined && answers[q.key] !== ""
    );
  };

  const handleNext = () => {
    if (activeStep === 0 && !isDemographicsComplete()) {
      alert("Please fill in all personal information fields before continuing.");
      return;
    }
    if (activeStep === 1 && !areQuestionsComplete(stressQuestions)) {
      alert("Please answer all stress questions before continuing.");
      return;
    }
    if (activeStep === 2 && !areQuestionsComplete(anxietyQuestions)) {
      alert("Please answer all anxiety questions before continuing.");
      return;
    }
    if (activeStep === 3 && !areQuestionsComplete(depressionQuestions)) {
      alert("Please answer all depression questions before submitting.");
      return;
    }
    if (activeStep < steps.length - 1) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    // Final safety check: 27 fields
    const allKeys = [
      ...demographicFields.map((f) => f.key),
      ...stressQuestions.map((q) => q.key),
      ...anxietyQuestions.map((q) => q.key),
      ...depressionQuestions.map((q) => q.key),
    ];
    const missing = allKeys.filter(
      (k) => answers[k] === undefined || answers[k] === ""
    );
    if (missing.length > 0) {
      alert("Some answers are missing. Please complete all questions.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await axios.post("http://127.0.0.1:8000/predict", answers);

      navigate("/result", { state: res.data });
    } catch (err) {
      console.error(err);
      alert(
        "Could not reach the prediction server. Please ensure the FastAPI backend is running."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // --------------- Render helpers ---------------

  const renderDemographics = () => (
    <Card sx={{ mt: 3, background: "#0e1b33", color: "#fff" }}>
      <CardContent>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Personal Information
        </Typography>
        <Typography variant="body2" sx={{ mb: 2, opacity: 0.8 }}>
          Please provide your basic details. These help us understand patterns
          across age, gender, education and lifestyle. All fields are required.
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {demographicFields.map((field) => (
          <Box key={field.key} sx={{ mb: 2 }}>
            {field.type === "number" ? (
              <>
                <TextField
                  type="number"
                  fullWidth
                  label={field.label}
                  value={answers[field.key] ?? ""}
                  onChange={(e) => updateAnswer(field.key, e.target.value)}
                  InputProps={{ sx: { color: "#fff" } }}
                  InputLabelProps={{ sx: { color: "#b0b0b0" } }}
                  sx={{
                    "& .MuiOutlinedInput-root fieldset": {
                      borderColor: "#00b4ff",
                    },
                  }}
                />
                {field.key === "Q1_1" && ageWarning && (
                  <FormHelperText sx={{ color: "#ffcc00" }}>
                    {ageWarning}
                  </FormHelperText>
                )}
                {field.helper && !ageWarning && (
                  <FormHelperText sx={{ color: "#b0b0b0" }}>
                    {field.helper}
                  </FormHelperText>
                )}
              </>
            ) : (
              <FormControl fullWidth>
                <InputLabel sx={{ color: "#b0b0b0" }}>{field.label}</InputLabel>
                <Select
                  value={answers[field.key] ?? ""}
                  label={field.label}
                  onChange={(e) => updateAnswer(field.key, e.target.value)}
                  sx={{
                    color: "#fff",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#00b4ff",
                    },
                    "& .MuiSvgIcon-root": {
                      color: "#00b4ff",
                    },
                  }}
                >
                  {field.options.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        ))}
      </CardContent>
    </Card>
  );

  const renderQuestionBlock = (title, description, questions) => (
    <Card sx={{ mt: 3, background: "#0e1b33", color: "#fff" }}>
      <CardContent>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" sx={{ mb: 2, opacity: 0.8 }}>
          {description}
        </Typography>
        <Divider sx={{ mb: 2 }} />
        {questions.map((q, index) => (
          <Box key={q.key} sx={{ mb: 2 }}>
            <Typography variant="body1" sx={{ mb: 1 }}>
              {`${index + 1}. (${q.code}) ${q.text}`}
            </Typography>
            <FormControl>
              <RadioGroup
                row
                value={
                  answers[q.key] !== undefined && answers[q.key] !== ""
                    ? String(answers[q.key])
                    : ""
                }
                onChange={(e) => updateAnswer(q.key, e.target.value)}
              >
                {scaleOptions.map((opt) => (
                  <FormControlLabel
                    key={opt.value}
                    value={String(opt.value)}
                    control={<Radio sx={{ color: "#00b4ff" }} />}
                    label={opt.label}
                    sx={{ color: "#fff" }}
                  />
                ))}
              </RadioGroup>
            </FormControl>
          </Box>
        ))}
      </CardContent>
    </Card>
  );

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return renderDemographics();
      case 1:
        return renderQuestionBlock(
          "Stress Assessment",
          "For each statement below, indicate how much it applied to you over the past week.",
          stressQuestions
        );
      case 2:
        return renderQuestionBlock(
          "Anxiety Assessment",
          "For each statement below, indicate how much it applied to you over the past week.",
          anxietyQuestions
        );
      case 3:
        return renderQuestionBlock(
          "Depression Assessment",
          "For each statement below, indicate how much it applied to you over the past week.",
          depressionQuestions
        );
      default:
        return null;
    }
  };

  // -------------------- JSX --------------------

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0f24 0%, #001f3f 100%)",
        py: 4,
        color: "#e0e0e0",
      }}
    >
      <Container maxWidth="md">
        <Typography
          variant="h4"
          fontWeight="bold"
          textAlign="center"
          gutterBottom
        >
          DASS-21 Questionnaire
        </Typography>
        <Typography
          variant="body2"
          textAlign="center"
          sx={{ mb: 3, opacity: 0.8 }}
        >
          Please answer all items honestly based on how you have felt{" "}
          <strong>over the past week</strong>. Your responses help estimate your
          current levels of stress, anxiety, and depression.
        </Typography>

        <Stepper
          activeStep={activeStep}
          alternativeLabel
          sx={{
            "& .MuiStepLabel-label": { color: "#e0e0e0" },
            "& .MuiStepIcon-root": { color: "#4c5b8a" },
            "& .MuiStepIcon-root.Mui-active": { color: "#00b4ff" },
            "& .MuiStepIcon-root.Mui-completed": { color: "#00e676" },
          }}
        >
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent()}

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mt: 3,
          }}
        >
          <Button
            variant="outlined"
            disabled={activeStep === 0 || submitting}
            onClick={handleBack}
            sx={{
              borderColor: "#00b4ff",
              color: "#00b4ff",
              "&:hover": { borderColor: "#0086c3", color: "#0086c3" },
            }}
          >
            Back
          </Button>

          {activeStep < steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={submitting}
              sx={{
                bgcolor: "#007bff",
                "&:hover": { bgcolor: "#005fcc" },
              }}
            >
              Next
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={submitting}
              sx={{
                bgcolor: "#00e676",
                color: "#000",
                fontWeight: "bold",
                "&:hover": { bgcolor: "#00c853" },
              }}
            >
              {submitting ? "Submitting..." : "Submit Assessment"}
            </Button>
          )}
        </Box>
      </Container>
    </Box>
  );
}
