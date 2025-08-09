export type NumberStatus = "ACTIVE" | "PAUSED" | "BLOCKED";
export type PoolMinQuality = "HIGH" | "MEDIUM" | "LOW";

export type NumberInfo = {
  id: string;
  label: string;
  quality: PoolMinQuality;
  status: NumberStatus;
};

// Fonte única do Pool de números para toda a app
export const AVAILABLE_NUMBERS: NumberInfo[] = [
  { id: "num_A", label: "Sender-01 (+55 11)", quality: "HIGH", status: "ACTIVE" },
  { id: "num_B", label: "Sender-02 (+55 21)", quality: "MEDIUM", status: "ACTIVE" },
  { id: "num_C", label: "Sender-03 (+55 31)", quality: "HIGH", status: "ACTIVE" },
  { id: "num_D", label: "Sender-04 (+55 41)", quality: "LOW", status: "PAUSED" },
  { id: "num_E", label: "Sender-05 (+55 51)", quality: "HIGH", status: "ACTIVE" },
];
