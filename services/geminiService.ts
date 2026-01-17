import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ClinicalInsight, RiskLevel, VitalSign } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING, description: "A concise clinical summary of the patient input." },
    riskLevel: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"], description: "Triage risk level." },
    confidenceScore: { type: Type.NUMBER, description: "Confidence in the extraction (0.0 to 1.0)." },
    themes: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING }, 
      description: "Thematic tags representing the core issues (e.g., 'Medication Non-Adherence', 'Glycemic Instability', 'Symptom Progression')." 
    },
    reasoning: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING }, 
      description: "List of reasons why this risk level was assigned." 
    },
    missingData: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING }, 
      description: "Ambiguities or missing info preventing a conclusion." 
    },
    extractedVitals: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, enum: ['BP_SYSTOLIC', 'BP_DIASTOLIC', 'GLUCOSE', 'SPO2', 'HEART_RATE', 'WEIGHT', 'TEMP'] },
          value: { type: Type.NUMBER },
          unit: { type: Type.STRING }
        }
      }
    },
    clinicalActionSuggestion: { type: Type.STRING, description: "Suggested workflow action for the care coordinator (e.g., 'Request recent labs', 'Schedule call')." },
    suggestedResponse: { type: Type.STRING, description: "A short, empathetic, non-diagnostic response to send back to the patient via WhatsApp. Confirm receipt of data." }
  },
  required: ["summary", "riskLevel", "confidenceScore", "themes", "reasoning", "extractedVitals", "suggestedResponse"]
};

export const analyzePatientInput = async (
  message: string, 
  patientHistoryContext: string
): Promise<{ insight: ClinicalInsight, vitals: VitalSign[], suggestedResponse: string }> => {
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        ROLE: Expert Clinical Safety AI Triage System.
        TASK: Analyze the incoming patient message (from WhatsApp). Extract vitals, identify symptoms, assess risk, and generate a patient reply.
        CONTEXT: Patient History Summary: ${patientHistoryContext}
        
        GUARDRAILS for ANALYSIS:
        1. DO NOT DIAGNOSE.
        2. Prioritize safety. If symptoms suggest cardiac distress, hypoglycemia, or sepsis, flag HIGH/CRITICAL.
        3. Be skeptical of outliers but record them.
        4. Identify core themes (e.g., "Anxiety", "Medication Adherence").

        GUARDRAILS for SUGGESTED RESPONSE:
        1. Tone: Empathetic, calm, professional (WhatsApp style).
        2. Action: Confirm data receipt (e.g., "Noted your reading of 150").
        3. Safety: If HIGH risk, advise them a clinician will review shortly. DO NOT give medical advice (like "take insulin").
        4. Length: Max 2 sentences.
        
        PATIENT MESSAGE: "${message}"
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        systemInstruction: "You are a healthcare triage assistant. You extract structured data from informal patient text and act as a communication bridge.",
      }
    });

    const jsonText = response.text || "{}";
    const data = JSON.parse(jsonText);

    // Map the raw JSON to our domain types
    const insight: ClinicalInsight = {
      summary: data.summary,
      riskLevel: data.riskLevel as RiskLevel,
      confidenceScore: data.confidenceScore,
      themes: data.themes || [],
      reasoning: data.reasoning,
      missingData: data.missingData || [],
      clinicalActionSuggestion: data.clinicalActionSuggestion || "Monitor"
    };

    const vitals: VitalSign[] = (data.extractedVitals || []).map((v: any) => ({
      ...v,
      timestamp: new Date().toISOString()
    }));

    return { 
      insight, 
      vitals,
      suggestedResponse: data.suggestedResponse || "Received. Updating your care log."
    };

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    // Fallback for safety - never fail silently in healthcare
    return {
      insight: {
        summary: "Error analyzing input. Manual review required.",
        riskLevel: RiskLevel.MEDIUM, // Default to medium on error for safety
        confidenceScore: 0,
        themes: ["System Error"],
        reasoning: ["AI System Error - Fallback"],
        missingData: ["Complete analysis failed"],
        clinicalActionSuggestion: "Manual Review"
      },
      vitals: [],
      suggestedResponse: "We have received your message. A care coordinator will review it shortly."
    };
  }
};