export const PromptTemplates = {
  clinicalTriage: (query: string): string => `
You are MedXNet's NLP Clinical Intake Agent. Your job is to analyze the patient's emergency query and extract key medical attributes.
You must return only a valid JSON object matching this structure:
{
  "symptoms": ["symptom1", "symptom2"],
  "medicines": ["medicine1"],
  "urgency": "Immediate Life Threat" | "Urgent" | "Semi-Urgent" | "Non-Urgent",
  "bloodGroup": "O-" | "A+" | "O+" | "A-" | "B+" | "AB-" | "",
  "allergies": ["allergy1"],
  "confidence": 0.95
}

Query: "${query}"

Return JSON only. Do not wrap in markdown or backticks.
`,

  explainability: (summary: string, decisionReason: string): string => `
Convert the following technical clinical routing decision into a clear, patient-friendly explanation.
Technical Details: "${summary}"
Decision Logic: "${decisionReason}"

Generate a reassuring, concise message telling the patient which vehicle/drone is coming, ETA, and basic safety actions. Return text directly.
`,

  recommendation: (eceLevel: number, symptoms: string[], location: string): string => `
Provide a structured medical advice recommendation for a triage category ECE-${eceLevel} presenting with symptoms: ${symptoms.join(', ')} located near ${location}.
Do not make a formal medical diagnosis. Give clear pre-hospital recommendations. Return text directly.
`
};

export default PromptTemplates;
