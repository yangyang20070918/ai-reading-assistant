import type { Priority } from "./classifier";

interface ReclassifyRecord {
  emailId: string;
  from: string;
  subject: string;
  originalPriority: Priority;
  newPriority: Priority;
  timestamp: number;
}

interface SenderRule {
  sender: string;
  priority: Priority;
  count: number;
}

const STORAGE_KEY = "ai-reading-preferences";
const RECLASSIFY_KEY = "ai-reading-reclassifications";

export function saveReclassification(
  emailId: string,
  from: string,
  subject: string,
  originalPriority: Priority,
  newPriority: Priority
) {
  const records = getReclassifications();
  records.push({
    emailId,
    from,
    subject,
    originalPriority,
    newPriority,
    timestamp: Date.now(),
  });
  localStorage.setItem(RECLASSIFY_KEY, JSON.stringify(records));
  updateSenderRules(from, newPriority);
}

export function getReclassifications(): ReclassifyRecord[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(RECLASSIFY_KEY);
  return raw ? JSON.parse(raw) : [];
}

function updateSenderRules(from: string, priority: Priority) {
  const rules = getSenderRules();
  const senderKey = extractDomain(from);
  const existing = rules.find((r) => r.sender === senderKey);
  if (existing) {
    existing.priority = priority;
    existing.count += 1;
  } else {
    rules.push({ sender: senderKey, priority, count: 1 });
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
}

export function getSenderRules(): SenderRule[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function getSenderPreference(from: string): Priority | null {
  const rules = getSenderRules();
  const domain = extractDomain(from);
  const rule = rules.find((r) => r.sender === domain);
  return rule ? rule.priority : null;
}

export function clearPreferences() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(RECLASSIFY_KEY);
}

function extractDomain(from: string): string {
  const match = from.match(/@([^>]+)/);
  return match ? match[1].toLowerCase() : from.toLowerCase();
}
