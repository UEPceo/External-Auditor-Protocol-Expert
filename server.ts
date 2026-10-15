import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json({ limit: '50mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', hasGeminiKey: Boolean(process.env.GEMINI_API_KEY) });
});

// Semantic Protocol Audit endpoint using Gemini 3.8 Flash
app.post('/api/audit-semantic', async (req, res) => {
  const { archiveName, files, forensicFindings } = req.body;

  if (!files || !Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ error: 'No document files provided for semantic audit.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(200).json({
      fallback: true,
      message: 'GEMINI_API_KEY not configured on server. Autonomous rule-based diagnostic engine active.'
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Format files for prompt
    const docSummaries = files
      .filter((f: any) => typeof f.content === 'string' && f.content.length > 0)
      .slice(0, 15) // limit to top 15 text docs to avoid token overflow
      .map((f: any) => `=== FILE: ${f.name} (${f.content.length} chars) ===\n${f.content.slice(0, 12000)}`)
      .join('\n\n');

    const prompt = `You are a world-class protocol audit specialist with deep expertise in:
1. Interstellar economics & settlement architecture (round-trip light delay 6-44 min Earth-Mars, custody vs title ambiguity, jurisdictional absence on sovereign-less space assets, physical enforcement asymmetry)
2. Formal verification of governance protocols (state replayability, tamper-evident evidence chains, single point of trust, PoTT - Proof of Transmission Time receipt verification)
3. Incentives and Game Theory (κ-trap / kappa-trap structural dependency, extraction without return route control, free-riding, collusion)

You are reviewing uploaded protocol documents for archive "${archiveName}".

Forensic Archive Integrity Notes:
${JSON.stringify(forensicFindings || [], null, 2)}

Documents for Protocol Audit:
${docSummaries}

Analyze the documentation thoroughly across these 5 dimensions:
1. Validity of the Settlement Architecture (latency 6-44 min finality, counterparty default, custody vs title separation, jurisdictional absence)
2. Governance and Auditability (replayability, tamper-evidence, single point of trust)
3. Failure Handling and Adversarial Resilience (partial failure bypass, forged timestamps, broken receipt chains)
4. Enforcement Asymmetry (physical presence requirements, degraded operating mode)
5. Incentives and Game Theory (κ-trap, collusion, free-riding)

Return ONLY valid JSON matching this exact structure:
{
  "flaws": [
    {
      "flawId": "AUDIT-001",
      "severity": "Critical" | "Major" | "Minor",
      "dimension": "Settlement Architecture" | "Governance" | "Failure Handling" | "Enforcement Asymmetry" | "Incentives" | "Technical Archive",
      "flawDescription": "Clear description of the exact structural flaw and why it is a problem",
      "evidenceLocation": "Specific document name and section or archive entry",
      "potentialImpact": "Concrete catastrophic or failure outcome if exploited or unfixed",
      "remediationRecommendation": "Specific, actionable improvement (not vague)",
      "precedent": "Known historical case or similar vulnerability (e.g., The DAO reentrancy, Mars Climate Orbiter unit mismatch, Mt. Gox malleability, EVE Online Jita blockade)"
    }
  ],
  "consistencyJudgment": {
    "verdict": "Consistent" | "Partially Contradictory" | "Fundamentally Contradictory",
    "analysis": "Detailed explanation of whether stated goals match actual architectural reality"
  },
  "undeclaredAssumptions": [
    {
      "assumption": "Implicit assumption name",
      "context": "Where this assumption is relied upon in the documents",
      "risk": "Why relying on this undeclared assumption creates severe vulnerabilities"
    }
  ],
  "recommendedNextSteps": [
    {
      "priority": "P0" | "P1" | "P2",
      "action": "Concrete recommended engineering or governance step",
      "rationale": "Why this must be addressed immediately"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      }
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    return res.json({ success: true, ...parsed });
  } catch (error: any) {
    console.error('Gemini audit error:', error);
    return res.status(200).json({
      fallback: true,
      error: error.message || 'Failed to complete semantic AI audit. Falling back to local engine.',
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Autonomous ZIP Audit & Protocol Diagnostic Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
