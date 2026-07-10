import type { CleanedFacts } from "../schemas/cleaned-facts.js";
import type { Categorization } from "../schemas/category.js";

export type QualityDecision = "PUBLISHED" | "REVIEW" | "REJECTED";

export interface QualityResult {
  score: number;
  decision: QualityDecision;
  reasons: string[];
}

// Deliberately rule-based rather than another LLM call: the inputs are
// already-validated structured data at this point, so a transparent,
// debuggable formula is more trustworthy than asking a model to "grade
// itself" — and it's free. Thresholds match architecture doc section 4.
const PUBLISH_THRESHOLD = 0.85;
const REVIEW_THRESHOLD = 0.5;

export function scoreQuality(
  facts: CleanedFacts,
  categorization: Categorization,
  hasImage: boolean,
): QualityResult {
  const checks: Array<[boolean, number, string]> = [
    [Boolean(facts.startAt), 0.3, "missing start date/time"],
    [Boolean(categorization.districtSlug), 0.25, "district could not be determined"],
    [facts.features.length > 0, 0.15, "no notable features extracted"],
    [hasImage, 0.15, "no image available"],
    [categorization.tagSlugs.length > 0, 0.15, "no tags assigned"],
  ];

  let score = 0;
  const reasons: string[] = [];
  for (const [passed, weight, reasonIfFailed] of checks) {
    if (passed) {
      score += weight;
    } else {
      reasons.push(reasonIfFailed);
    }
  }
  score = Math.round(score * 100) / 100;

  const decision: QualityDecision =
    score >= PUBLISH_THRESHOLD ? "PUBLISHED" : score >= REVIEW_THRESHOLD ? "REVIEW" : "REJECTED";

  return { score, decision, reasons };
}
