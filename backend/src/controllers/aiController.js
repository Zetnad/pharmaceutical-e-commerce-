const Anthropic = require('@anthropic-ai/sdk');
const AIConsultation = require('../models/AIConsultation');
const User = require('../models/User');
const { asyncHandler, sendSuccess, sendError } = require('../middleware/errorHandler');

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;
const hasDatabase = Boolean(process.env.MONGODB_URI);

const SYSTEM_PROMPT = `You are MediHub HMS's AI clinical assistant integrated into a hospital management system used by hospitals and clinics in East Africa.

Your role:
1. Analyze patient-described symptoms or clinical summaries carefully and conservatively
2. Identify 2-4 possible conditions with estimated confidence levels
3. Suggest supportive care and safe OTC options only when appropriate
4. Clearly state when urgent emergency care or licensed clinician review is needed
5. Assess urgency level: low / medium / high / emergency
6. Keep the output practical for triage and frontline clinical review

ALWAYS respond in this exact JSON format:
{
  "summary": "Brief empathetic 1-2 sentence acknowledgment of the symptoms",
  "possibleConditions": [
    { "name": "Condition Name", "confidence": 75, "description": "Brief explanation" }
  ],
  "suggestedMedications": [
    { "name": "Drug Name", "dosage": "500mg", "frequency": "Every 8 hours", "type": "OTC", "notes": "Take with food" }
  ],
  "urgencyLevel": "low|medium|high|emergency",
  "doctorVisitRecommended": true|false,
  "doctorVisitReason": "Reason if recommended",
  "selfCareAdvice": ["Rest adequately", "Stay hydrated", "..."],
  "disclaimer": "⚕️ This AI analysis is for informational purposes only and does not replace assessment by a licensed healthcare professional."
}

Rules:
- Never present the output as a confirmed diagnosis
- Never suggest antibiotics, controlled drugs, or other prescription-only medicines as self-medication
- If emergency red flags are present (chest pain, difficulty breathing, stroke-like symptoms, seizure, severe bleeding, confusion, collapse), set urgencyLevel to "emergency"
- Mention when doctor or clinical officer review is appropriate
- Be compassionate, concise, and safety-first`;

const hasPositivePhrase = (text, phrase) => {
  if (!text.includes(phrase)) return false;
  const negations = [
    `no ${phrase}`,
    `not ${phrase}`,
    `without ${phrase}`,
    `denies ${phrase}`,
    `deny ${phrase}`
  ];
  return !negations.some((negated) => text.includes(negated));
};

const includesAny = (text, phrases) => phrases.some((phrase) => hasPositivePhrase(text, phrase));

const buildFallbackAnalysis = (symptoms) => {
  const text = symptoms.toLowerCase();

  const emergency = includesAny(text, [
    'chest pain',
    'difficulty breathing',
    'shortness of breath',
    'not breathing',
    'severe bleeding',
    'unconscious',
    'collapsed',
    'collapse',
    'seizure',
    'stroke',
    'one-sided weakness',
    'slurred speech',
    'confusion'
  ]);

  if (emergency) {
    return {
      summary: 'The symptoms described include danger signs that need emergency evaluation right away.',
      possibleConditions: [
        {
          name: 'Acute medical emergency',
          confidence: 90,
          description: 'Symptoms such as chest pain, breathing difficulty, collapse, severe bleeding, or stroke-like signs need immediate emergency assessment.'
        }
      ],
      suggestedMedications: [],
      urgencyLevel: 'emergency',
      doctorVisitRecommended: true,
      doctorVisitReason: 'Immediate emergency review is required because serious red-flag symptoms are present.',
      selfCareAdvice: [
        'Seek emergency care immediately.',
        'Do not delay for home treatment if breathing, circulation, or neurologic symptoms are worsening.',
        'Bring any current medication list or recent medical records if available.'
      ],
      disclaimer: '⚕️ This fallback analysis is informational only and must not replace urgent assessment by a licensed healthcare professional.'
    };
  }

  const possibleConditions = [];
  const suggestedMedications = [];
  const selfCareAdvice = ['Stay hydrated unless a clinician has advised fluid restriction.', 'Rest and monitor for worsening symptoms.'];
  let urgencyLevel = 'medium';
  let doctorVisitRecommended = true;
  let doctorVisitReason = 'A licensed clinician should review the symptoms if they persist, worsen, or interfere with normal activity.';

  if (includesAny(text, ['fever', 'sore throat', 'cough', 'body aches', 'runny nose'])) {
    possibleConditions.push({
      name: 'Viral upper respiratory infection',
      confidence: 74,
      description: 'Fever, throat symptoms, cough, congestion, and body aches are commonly seen with viral respiratory illness.'
    });
    suggestedMedications.push({
      name: 'Paracetamol',
      dosage: '500mg',
      frequency: 'Every 6-8 hours as needed',
      type: 'OTC',
      notes: 'Use within label guidance and avoid double-dosing with combination cold medicines.'
    });
    selfCareAdvice.push('Warm fluids, throat soothing measures, and rest may help if swallowing is still possible.');
  }

  if (includesAny(text, ['fever', 'chills', 'body aches', 'mosquito', 'malaria'])) {
    possibleConditions.push({
      name: 'Acute febrile illness needing malaria assessment',
      confidence: 52,
      description: 'In malaria-endemic settings, fever with chills or body aches may need malaria testing rather than home treatment alone.'
    });
    doctorVisitRecommended = true;
    doctorVisitReason = 'Fever in endemic settings may require testing such as malaria screening and clinician review.';
  }

  if (includesAny(text, ['vomiting', 'diarrhea', 'loose stool', 'dehydration', 'abdominal pain'])) {
    possibleConditions.push({
      name: 'Gastroenteritis or other gastrointestinal illness',
      confidence: 70,
      description: 'Vomiting, diarrhea, abdominal discomfort, and reduced intake are common in short-term gastrointestinal infections or irritation.'
    });
    suggestedMedications.push({
      name: 'Oral rehydration solution',
      dosage: 'As directed',
      frequency: 'Small frequent sips',
      type: 'OTC',
      notes: 'Useful when diarrhea or vomiting is increasing fluid loss.'
    });
    selfCareAdvice.push('Watch carefully for reduced urine output, dizziness, or inability to keep fluids down.');
  }

  if (includesAny(text, ['burning urination', 'burning when urinating', 'frequent urination', 'urinary'])) {
    possibleConditions.push({
      name: 'Urinary tract irritation or infection',
      confidence: 64,
      description: 'Pain or burning during urination with frequency can suggest urinary tract infection or related irritation.'
    });
    doctorVisitRecommended = true;
    doctorVisitReason = 'Urinary symptoms often need testing before treatment, especially if fever, flank pain, or pregnancy is involved.';
  }

  if (includesAny(text, ['rash', 'itching', 'hives', 'allergy'])) {
    possibleConditions.push({
      name: 'Allergic reaction or dermatitis',
      confidence: 61,
      description: 'Rash or itching may be related to an allergic response, contact trigger, or skin irritation.'
    });
    suggestedMedications.push({
      name: 'Cetirizine',
      dosage: '10mg',
      frequency: 'Once daily if appropriate',
      type: 'OTC',
      notes: 'Avoid self-treatment if there is facial swelling, wheeze, or breathing difficulty.'
    });
  }

  if (includesAny(text, ['headache', 'fatigue', 'stress'])) {
    possibleConditions.push({
      name: 'Tension-type headache or non-specific systemic illness',
      confidence: 55,
      description: 'Headache and fatigue can occur with viral illness, stress, dehydration, or other non-specific conditions.'
    });
  }

  if (includesAny(text, ['severe pain', 'persistent vomiting', 'unable to drink', 'pregnant', 'pregnancy', 'infant'])) {
    urgencyLevel = 'high';
    doctorVisitRecommended = true;
    doctorVisitReason = 'The description includes higher-risk features that should be reviewed promptly by a doctor or clinical officer.';
  }

  if (possibleConditions.length === 0) {
    possibleConditions.push({
      name: 'Undifferentiated illness',
      confidence: 45,
      description: 'The information provided is limited, so a careful history and examination are needed to narrow the cause.'
    });
  }

  if (suggestedMedications.length === 0) {
    suggestedMedications.push({
      name: 'Supportive care only',
      dosage: 'N/A',
      frequency: 'As appropriate',
      type: 'Supportive',
      notes: 'No specific self-medication can be suggested safely from the available information.'
    });
  }

  if (urgencyLevel === 'medium' && possibleConditions.length === 1 && possibleConditions[0].name === 'Viral upper respiratory infection') {
    doctorVisitRecommended = false;
    doctorVisitReason = 'A clinician review may not be immediately necessary if symptoms are mild, but seek care if they worsen, last beyond a few days, or red flags appear.';
  }

  return {
    summary: 'The symptoms suggest a problem that may be manageable with supportive care in mild cases, but they should be monitored carefully for worsening or red-flag features.',
    possibleConditions: possibleConditions.slice(0, 4),
    suggestedMedications: suggestedMedications.slice(0, 4),
    urgencyLevel,
    doctorVisitRecommended,
    doctorVisitReason,
    selfCareAdvice: [...new Set(selfCareAdvice)].slice(0, 5),
    disclaimer: '⚕️ This fallback analysis is informational only and does not replace assessment by a licensed healthcare professional.'
  };
};

// @route  POST /api/ai/analyze
exports.analyzeSymptoms = asyncHandler(async (req, res) => {
  const { symptoms, sessionId } = req.body;
  if (!symptoms || symptoms.trim().length < 10)
    return sendError(res, 400, 'Please describe your symptoms in more detail (at least 10 characters).');

  // Check AI usage limit for free users
  if (req.user && hasDatabase) {
    const user = await User.findById(req.user._id);
    if (user && !user.canUseAI()) {
      return sendError(res, 403, 'You have reached your monthly AI check limit (5 for free plan). Upgrade to Premium for unlimited checks.');
    }
  }

  let aiData;
  let rawText = '';

  if (client) {
    try {
      const message = await client.messages.create({
        model: 'claude-opus-4-5',
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: symptoms }]
      });

      rawText = message.content[0].text;

      try {
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        aiData = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
      } catch (e) {
        aiData = buildFallbackAnalysis(symptoms);
        rawText = JSON.stringify(aiData);
      }
    } catch (error) {
      console.warn('AI provider unavailable, using fallback analysis:', error.message);
      aiData = buildFallbackAnalysis(symptoms);
      rawText = JSON.stringify(aiData);
    }
  } else {
    aiData = buildFallbackAnalysis(symptoms);
    rawText = JSON.stringify(aiData);
  }

  // Save consultation
  let consultation = null;
  if (hasDatabase) {
    consultation = await AIConsultation.create({
      user: req.user?._id || null,
      symptoms,
      aiResponse: rawText,
      possibleConditions: aiData.possibleConditions || [],
      suggestedMedications: aiData.suggestedMedications || [],
      urgencyLevel: aiData.urgencyLevel || 'medium',
      doctorVisitRecommended: aiData.doctorVisitRecommended || false,
      ipAddress: req.ip,
      sessionId: sessionId || null
    });
  }

  // Increment usage counter for free users
  if (req.user && hasDatabase) {
    await User.findByIdAndUpdate(req.user._id, { $inc: { aiChecksUsed: 1 } });
  }

  sendSuccess(res, 200, 'Analysis complete.', {
    consultationId: consultation?._id || null,
    analysis: aiData
  });
});

// @route  GET /api/ai/history  (auth required)
exports.getAIHistory = asyncHandler(async (req, res) => {
  const consultations = await AIConsultation.find({ user: req.user._id })
    .sort('-createdAt').limit(20).select('symptoms possibleConditions urgencyLevel createdAt');
  sendSuccess(res, 200, 'Consultation history fetched.', { consultations });
});

// @route  GET /api/ai/consultation/:id
exports.getConsultation = asyncHandler(async (req, res) => {
  const consultation = await AIConsultation.findById(req.params.id);
  if (!consultation) return sendError(res, 404, 'Consultation not found.');
  if (consultation.user && consultation.user.toString() !== req.user._id.toString())
    return sendError(res, 403, 'Unauthorized.');
  sendSuccess(res, 200, 'Consultation fetched.', { consultation });
});
