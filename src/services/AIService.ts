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
      const text = await GeminiProvider.generateContent(prompt);
      
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
    
    if (queryLower.includes('chest pain')) {
      symptoms.push('chest pain');
      urgency = 'Immediate Life Threat';
    }
    if (queryLower.includes('breathing')) {
      symptoms.push('breathing difficulty');
      urgency = 'Immediate Life Threat';
    }
    if (queryLower.includes('bleeding')) {
      symptoms.push('heavy bleeding');
      urgency = 'Urgent';
    }
    if (queryLower.includes('snake')) {
      symptoms.push('snake bite');
      urgency = 'Urgent';
    }
    if (queryLower.includes('fever')) {
      symptoms.push('high fever');
      urgency = 'Semi-Urgent';
    }
    if (queryLower.includes('insulin')) {
      medicines.push('Insulin');
      urgency = 'Semi-Urgent';
    }
    if (queryLower.includes('blood') || queryLower.includes('o-') || queryLower.includes('o negative')) {
      bloodGroup = 'O-';
      symptoms.push('blood');
    }

    // Check for age in query (e.g. "50 years old" -> 50)
    let age: number | null = null;
    const ageMatch = query.match(/(\d+)\s*(years|yrs|yo|age)/i);
    if (ageMatch) {
      age = parseInt(ageMatch[1]);
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
      rawJson: JSON.stringify({ symptoms, medicines, urgency, age, bloodGroup, allergies: [], confidence: 0.95 }),
      parserMode: 'Mock'
    };
  }
}
export default AIService;
