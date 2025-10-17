import fetch from 'node-fetch';

const PERSPECTIVE_API_KEY = process.env.PERSPECTIVE_API_KEY;
const PERSPECTIVE_API_URL = 'https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze';

export async function analyzeContent(text) {
  try {
    if (!PERSPECTIVE_API_KEY) {
      console.error('Perspective API key is not configured');
      return {
        safetyScore: 0,
        scores: null,
        isAutoApproved: false
      };
    }

    const response = await fetch(`${PERSPECTIVE_API_URL}?key=${PERSPECTIVE_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        comment: { text },
        languages: ['en'],
        requestedAttributes: {
          TOXICITY: {},
          SEVERE_TOXICITY: {},
          IDENTITY_ATTACK: {},
          THREAT: {},
          PROFANITY: {},
          SEXUALLY_EXPLICIT: {}
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Perspective API error details:', errorData);
      throw new Error(`Perspective API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    
    // Calculate an overall safety score (inverse of the maximum risk score)
    const scores = {
      toxicity: data.attributeScores.TOXICITY.summaryScore.value,
      severeToxicity: data.attributeScores.SEVERE_TOXICITY.summaryScore.value,
      identityAttack: data.attributeScores.IDENTITY_ATTACK.summaryScore.value,
      threat: data.attributeScores.THREAT.summaryScore.value,
      profanity: data.attributeScores.PROFANITY.summaryScore.value,
      sexuallyExplicit: data.attributeScores.SEXUALLY_EXPLICIT.summaryScore.value
    };

    // Get the highest risk score
    const maxRiskScore = Math.max(...Object.values(scores));
    
    // Convert to a safety score (0-100, where 100 is safest)
    const safetyScore = Math.round((1 - maxRiskScore) * 100);

    return {
      safetyScore,
      scores,
      isAutoApproved: safetyScore >= 90
    };
  } catch (error) {
    console.error('Perspective API analysis failed:', error);
    // In case of API failure, set for manual review
    return {
      safetyScore: 0,
      scores: null,
      isAutoApproved: false
    };
  }
}