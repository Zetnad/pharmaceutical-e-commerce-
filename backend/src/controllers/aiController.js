const Anthropic = require('@anthropic-ai/sdk');
const AIConsultation = require('../models/AIConsultation');
const User = require('../models/User');
const { asyncHandler, sendSuccess, sendError } = require('../middleware/errorHandler');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are MediHub's AI clinical assistant — a knowledgeable, empathetic healthcare guide integrated into Africa's leading pharmaceutical SaaS platform.

Your role:
1. Analyze patient-described symptoms carefully and thoroughly
2. Identify 2-4 possible conditions with estimated confidence levels (as percentages)
3. Recommend appropriate OTC (over-the-counter) medications with dosage and frequency where safe
4. Clearly state when urgent medical attention or a doctor visit is needed
5. Assess urgency level: low / medium / high / emergency

ALWAYS respond in this exact JSON format:
{
  "summary": "Brief empathetic 1-2 sentence acknowledgment of their symptoms",
  "possibleConditions": [
    { "name": "Condition Name", "confidence": 75, "description": "Brief explanation" }
  ],
  "suggestedMedications": [
    { "name": "Drug Name", "dosage": "500mg", "frequency": "Every 8 hours", "type": "OTC", "notes": "Take with food" }
  ],
  "urgencyLevel": "low|medium|high|emergency",
  "doctorVisitRecommended": true|false,
  "doctorVisitReason": "Reason if recommended",
  "selfCareAdvice": ["Rest adequately", "Stay hydrated", ...],
  "disclaimer": "⚕️ This AI analysis is for informational purposes only and does not constitute a medical diagnosis. Always consult a licensed healthcare professional before taking any medication."
}

Rules:
- Never suggest Rx-only medications (antibiotics, antivirals, controlled substances) without explicitly noting they require a prescription
- For symptoms suggesting emergency (chest pain, difficulty breathing, stroke signs, severe bleeding) — set urgencyLevel to "emergency" and advise calling emergency services immediately
- Keep medication suggestions relevant to the East African pharmaceutical market (Kenya, Uganda, Tanzania)
- Prices are in KSh where relevant
- Be compassionate and clear`;

// @route  POST /api/ai/analyze
exports.analyzeSymptoms = asyncHandler(async (req, res) => {
  const { symptoms, sessionId } = req.body;
  if (!symptoms || symptoms.trim().length < 10)
    return sendError(res, 400, 'Please describe your symptoms in more detail (at least 10 characters).');

  // Check AI usage limit for free users
  if (req.user) {
    const user = await User.findById(req.user._id);
    if (!user.canUseAI()) {
      return sendError(res, 403, 'You have reached your monthly AI check limit (5 for free plan). Upgrade to Premium for unlimited checks.');
    }
  }

  // Call Claude AI
  const message = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 1500,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: symptoms }]
  });

  let aiData;
  const rawText = message.content[0].text;

  try {
    // Extract JSON from response
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    aiData = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
  } catch (e) {
    // Fallback if JSON parse fails
    aiData = {
      summary: rawText,
      possibleConditions: [],
      suggestedMedications: [],
      urgencyLevel: 'medium',
      doctorVisitRecommended: true,
      selfCareAdvice: [],
      disclaimer: '⚕️ This AI analysis is for informational purposes only. Consult a licensed doctor.'
    };
  }

  // Save consultation
  const consultation = await AIConsultation.create({
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

  // Increment usage counter for free users
  if (req.user) {
    await User.findByIdAndUpdate(req.user._id, { $inc: { aiChecksUsed: 1 } });
  }

  sendSuccess(res, 200, 'Analysis complete.', {
    consultationId: consultation._id,
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
