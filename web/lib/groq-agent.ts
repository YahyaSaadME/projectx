import Groq from "groq-sdk";

export type LeadRoutingDecision = {
  action: "assign" | "queue" | "escalate" | "confirm_stock";
  reason: string;
  candidateEmail?: string;
};

function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return null;
  }

  return new Groq({ apiKey });
}

export async function decideLeadRouting(input: {
  organizationName: string;
  agentPrompt: string;
  rules: string[];
  stockSummary: string;
  leadSummary: string;
  candidates: Array<{ name: string; email: string; score: number; assignedCount: number; role: string }>;
}) {
  const client = getGroqClient();

  if (!client) {
    return null;
  }

  const response = await client.chat.completions.create({
    model: process.env.GROQ_MODEL ?? "llama3-8b-8192",
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "You route inbound sales leads. Return only valid JSON with keys action, reason, candidateEmail. action must be assign, queue, escalate, or confirm_stock. Choose the lowest score eligible member unless a rule says otherwise.",
      },
      {
        role: "user",
        content: JSON.stringify({
          organizationName: input.organizationName,
          agentPrompt: input.agentPrompt,
          rules: input.rules,
          stockSummary: input.stockSummary,
          leadSummary: input.leadSummary,
          candidates: input.candidates,
        }),
      },
    ],
  });

  const content = response.choices[0]?.message?.content?.trim();

  if (!content) {
    return null;
  }

  try {
    return JSON.parse(content) as LeadRoutingDecision;
  } catch {
    return null;
  }
}