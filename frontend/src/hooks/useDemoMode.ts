export function isDemoMode(): boolean {
  return localStorage.getItem("acp-demo-mode") === "true";
}

export function getDemoData<T>(key: string): T[] {
  const data = localStorage.getItem(`demo-${key}`);
  return data ? JSON.parse(data) : [];
}

export function setDemoData<T>(key: string, data: T[]): void {
  localStorage.setItem(`demo-${key}`, JSON.stringify(data));
}

export function generateId(): string {
  return crypto.randomUUID();
}
