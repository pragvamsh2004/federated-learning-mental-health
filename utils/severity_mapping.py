# utils/severity_mapping.py

from typing import Literal

Severity = Literal["Normal", "Mild", "Moderate", "Severe", "Extremely Severe"]


def depression_severity(score: int) -> Severity:
    """
    DASS-21 Depression severity bands (score already multiplied if needed).
    """
    if score <= 9:
        return "Normal"
    elif score <= 13:
        return "Mild"
    elif score <= 20:
        return "Moderate"
    elif score <= 27:
        return "Severe"
    else:
        return "Extremely Severe"


def anxiety_severity(score: int) -> Severity:
    """
    DASS-21 Anxiety severity bands.
    """
    if score <= 7:
        return "Normal"
    elif score <= 9:
        return "Mild"
    elif score <= 14:
        return "Moderate"
    elif score <= 19:
        return "Severe"
    else:
        return "Extremely Severe"


def stress_severity(score: int) -> Severity:
    """
    DASS-21 Stress severity bands.
    """
    if score <= 14:
        return "Normal"
    elif score <= 18:
        return "Mild"
    elif score <= 25:
        return "Moderate"
    elif score <= 33:
        return "Severe"
    else:
        return "Extremely Severe"
