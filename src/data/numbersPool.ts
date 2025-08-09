export type NumberStatus = "ACTIVE" | "PAUSED" | "BLOCKED";
export type PoolMinQuality = "HIGH" | "MEDIUM" | "LOW";

export type NumberInfo = {
  id: string;
  label: string;
  quality: PoolMinQuality;
  status: NumberStatus;
};

// Fonte única do Pool de números para toda a app
export const NUMBERS_STORAGE_KEY = "numbers_pool_v1";

const DEFAULT_NUMBERS: NumberInfo[] = [
  { id: "num_A", label: "Sender-01 (+55 11)", quality: "HIGH", status: "ACTIVE" },
  { id: "num_B", label: "Sender-02 (+55 21)", quality: "MEDIUM", status: "ACTIVE" },
  { id: "num_C", label: "Sender-03 (+55 31)", quality: "HIGH", status: "ACTIVE" },
  { id: "num_D", label: "Sender-04 (+55 41)", quality: "LOW", status: "PAUSED" },
  { id: "num_E", label: "Sender-05 (+55 51)", quality: "HIGH", status: "ACTIVE" },
];

export function loadAvailableNumbers(): NumberInfo[] {
  try {
    const raw = window.localStorage.getItem(NUMBERS_STORAGE_KEY);
    if (!raw) return DEFAULT_NUMBERS;
    const parsed = JSON.parse(raw) as Array<Partial<NumberInfo> & Record<string, any>>;
    return parsed.map((n, idx) => ({
      id: (n.id as string) ?? `num_${idx + 1}`,
      label: (n.label as string) ?? `Sender-${String(idx + 1).padStart(2, "0")}`,
      quality: (n.quality as PoolMinQuality) ?? "HIGH",
      status: (n.status as NumberStatus) ?? "ACTIVE",
    }));
  } catch {
    return DEFAULT_NUMBERS;
  }
}

// Carrega no boot; consumidores podem reimportar este módulo para atualizar
export const AVAILABLE_NUMBERS: NumberInfo[] = loadAvailableNumbers();
