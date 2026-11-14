// Free-trial status for a workspace. New workspaces start on a 14-day
// trial (see register/actions.ts). Workspaces created before trials existed
// (e.g. RTL Records) have no end date — they show as an open-ended trial.

export type TrialInfo = {
  label: string;
  daysLeft: number | null;
  expired: boolean;
};

export function trialInfo(w: { plan: string; trialEndsAt: Date | null }): TrialInfo | null {
  if (w.plan !== "trial") return null;
  if (!w.trialEndsAt) {
    return { label: "Free trial", daysLeft: null, expired: false };
  }
  const daysLeft = Math.ceil((w.trialEndsAt.getTime() - Date.now()) / 86_400_000);
  if (daysLeft < 0) {
    return { label: "Free trial ended", daysLeft, expired: true };
  }
  return {
    label: `Free trial — ${daysLeft} day${daysLeft === 1 ? "" : "s"} left`,
    daysLeft,
    expired: false,
  };
}
