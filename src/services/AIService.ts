import { GeminiProvider } from '../integrations/GeminiProvider';
import { PromptTemplates } from '../integrations/PromptTemplates';

export interface AIServiceResponse {
  symptoms: string[];
  medicines: string[];
  medicineIntent: string[];
  urgency: string;
  age: number | null;
  bloodGroup: string;
  allergies: string[];
  confidence: number;
  urgencyKeywords?: string[];
  reasoning?: string;
  rawJson?: string;
  parserMode: 'Gemini' | 'Mock';
}

export class AIService {
  static async extractClinicalAttributes(query: string, mode: 'Mock' | 'Production'): Promise<AIServiceResponse> {
    if (mode === 'Mock') {
      return this.fallbackMockParser(query);
    }

    try {
      const prompt = PromptTemplates.clinicalTriage(query);
      const text = await GeminiProvider.generateContent(prompt, 'json');
      
      // Filter out any markdown block formatting codeblocks if returned
      let cleanText = text;
      if (text.includes('```json')) {
        cleanText = text.split('```json')[1].split('```')[0].trim();
      } else if (text.includes('```')) {
        cleanText = text.split('```')[1].split('```')[0].trim();
      }

      const parsed = JSON.parse(cleanText);
      return {
        symptoms: parsed.symptoms || [],
        medicines: parsed.medicines || [],
        medicineIntent: parsed.medicineIntent || parsed.medicines || [],
        urgency: parsed.urgency || 'Non-Urgent',
        age: parsed.age || null,
        bloodGroup: parsed.bloodGroup || '',
        allergies: parsed.allergies || [],
        confidence: parsed.confidence || 0.9,
        urgencyKeywords: parsed.urgencyKeywords || [],
        reasoning: parsed.reasoning || '',
        rawJson: cleanText,
        parserMode: 'Gemini'
      };
    } catch (err) {
      console.warn('[AIService] Gemini request failed. Falling back to local rules parser...', err);
      return this.fallbackMockParser(query);
    }
  }

  static fallbackMockParser(query: string): AIServiceResponse {
    const queryLower = query.toLowerCase();
    const symptoms: string[] = [];
    const medicines: string[] = [];
    let urgency = 'Non-Urgent';
    let bloodGroup = '';

    // Common medical directories for lookup
    const knownSymptoms = [
      'chest pain', 'breathing difficulty', 'heavy bleeding', 'snake bite', 'high fever', 
      'headache', 'asthma flareup', 'burn', 'fracture', 'stroke', 'seizure', 'abdominal pain',
      'nausea', 'vomiting', 'allergic reaction', 'heart attack', 'cardiac arrest',
      'malaria', 'dengue', 'infection', 'covid', 'diabetic crisis', 'dehydration'
    ];

    const knownMedicines = [
      'insulin', 'atorvastatin', 'metformin', 'amoxicillin', 'paracetamol', 'aspirin',
      'ibuprofen', 'epinephrine', 'albuterol', 'chloroquine', 'penicillin', 'lipitor', 'glucophage'
    ];

    // 1. Check known directories
    for (const sym of knownSymptoms) {
      if (queryLower.includes(sym)) {
        symptoms.push(sym);
      }
    }
    for (const med of knownMedicines) {
      if (queryLower.includes(med)) {
        medicines.push(med);
      }
    }

    // 2. Dynamic extraction via NLP pattern matching
    // Extract disease or symptom after common verbs/prepositions
    const symptomRegexes = [
      /(?:suffering from|diagnosed with|has|symptom of|acute|chronic|severe)\s+([a-zA-Z\s]{3,20})(?:\.|\s+and|\s+with|\s+needs|,|$)/i,
      /pain in (?:my )?([a-zA-Z\s]{3,20})/i
    ];
    for (const regex of symptomRegexes) {
      const match = query.match(regex);
      if (match && match[1]) {
        const extracted = match[1].trim();
        if (extracted && !symptoms.includes(extracted)) {
          symptoms.push(extracted);
        }
      }
    }

    // Extract medicine after common verbs/prepositions
    const medicineRegexes = [
      /(?:needs|take|prescribed|ordered|medicine|dose of|vials of)\s+([a-zA-Z]{3,20})/i
    ];
    for (const regex of medicineRegexes) {
      const match = query.match(regex);
      if (match && match[1]) {
        const extracted = match[1].trim();
        if (extracted && !medicines.includes(extracted) && extracted.toLowerCase() !== 'a' && extracted.toLowerCase() !== 'some') {
          medicines.push(extracted);
        }
      }
    }

    // 3. Dynamic Urgency Assignment based on risk severity
    const highRiskTerms = ['heart', 'chest pain', 'stroke', 'unconscious', 'breathing', 'asphyxia', 'cardiac', 'seizure', 'coma', 'poison', 'anaphylaxis'];
    const medRiskTerms = ['bleeding', 'fracture', 'snake', 'burn', 'acute', 'severe', 'pain', 'infection', 'injury', 'malaria', 'dengue', 'critical', 'severity', 'high severity'];
    const lowRiskTerms = ['fever', 'cough', 'vomiting', 'allergy', 'asthma', 'diarrhea', 'headache'];

    let hasHigh = false;
    let hasMed = false;
    let hasLow = false;

    for (const term of highRiskTerms) {
      if (queryLower.includes(term)) hasHigh = true;
    }
    for (const term of medRiskTerms) {
      if (queryLower.includes(term)) hasMed = true;
    }
    for (const term of lowRiskTerms) {
      if (queryLower.includes(term)) hasLow = true;
    }

    if (hasHigh) {
      urgency = 'Immediate Life Threat';
    } else if (hasMed) {
      urgency = 'Urgent';
    } else if (hasLow || queryLower.includes('insulin')) {
      urgency = 'Semi-Urgent';
    } else {
      urgency = 'Non-Urgent';
    }

    // Extract blood group
    const bgMatch = queryLower.match(/\b(o-|o\+|a-|a\+|b-|b\+|ab-|ab\+)\b/i);
    if (bgMatch) {
      bloodGroup = bgMatch[1].toUpperCase();
    } else if (queryLower.includes('o negative') || queryLower.includes('o-')) {
      bloodGroup = 'O-';
    }

    // Check for age in query
    let age: number | null = null;
    const ageMatch = query.match(/(\d+)\s*(years|yrs|yo|age)/i);
    if (ageMatch) {
      age = parseInt(ageMatch[1]);
    }

    const urgencyKeywords: string[] = [];
    const urgentWordsList = ['severe', 'severity', 'high severity', 'continuous', 'unbearable', 'worsening', 'cannot breathe', 'unconscious', 'heavy bleeding', 'critical', 'criticality', 'intense'];
    for (const w of urgentWordsList) {
      if (queryLower.includes(w)) {
        urgencyKeywords.push(w);
      }
    }

    // If both extracted lists are empty, add a general symptom placeholder from the query
    if (symptoms.length === 0) {
      const words = query.split(' ').slice(0, 3).join(' ').replace(/[^a-zA-Z\s]/g, '');
      if (words) symptoms.push(words);
    }

    return {
      symptoms,
      medicines,
      medicineIntent: medicines,
      urgency,
      age,
      bloodGroup,
      allergies: queryLower.includes('penicillin') ? ['Penicillin'] : [],
      confidence: 0.95,
      urgencyKeywords,
      reasoning: 'Dynamic AI rule-based clinical parser executed.',
      rawJson: JSON.stringify({ symptoms, medicines, urgency, age, bloodGroup, allergies: [], confidence: 0.95 }),
      parserMode: 'Mock'
    };
  }
}
export default AIService;
