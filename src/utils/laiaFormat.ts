import type { LAIAAssessment } from "@/types/laia";

const MAX_ACTIVITY_LEN = 50;

export function formatAssessmentLabel(
  assessment: Pick<LAIAAssessment, "aspect_code" | "activity_operation">,
): string {
  const activity = assessment.activity_operation?.trim();
  if (!activity) return assessment.aspect_code;
  const trimmed =
    activity.length > MAX_ACTIVITY_LEN
      ? `${activity.slice(0, MAX_ACTIVITY_LEN - 1).trimEnd()}…`
      : activity;
  return `${assessment.aspect_code} — ${trimmed}`;
}
