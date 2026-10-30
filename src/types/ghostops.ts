export type AiProviderType = 'offline' | 'ollama' | 'openai' | 'anthropic' | 'gemini';

export interface AiProviderConfig {
  type: AiProviderType;
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  temperature?: number;
}

export type HintLevel = 1 | 2 | 3 | 4 | 5;

export interface MentorHint {
  level: HintLevel;
  levelTitle: string;
  machineId: string;
  machineName: string;
  currentPhase: 'RECON' | 'FOOTHOLD' | 'PRIVESC' | 'ROOTED';
  content: string;
  relevantEvidence: string[];
  suggestedAction?: string;
}

export interface PayloadParameter {
  id: string;
  label: string;
  description: string;
  defaultValue: string;
  placeholder: string;
}

export interface PayloadTemplate {
  id: string;
  title: string;
  category: 'REVERSE_SHELL' | 'WEB_INJECTION' | 'PRIVESC' | 'AD_KERBEROS' | 'SHELL_STABILIZE';
  description: string;
  educationalExplanation: string;
  safetyNotes: string;
  parameters: PayloadParameter[];
  template: (params: Record<string, string>) => string;
}

export type AutopilotStatus = 'IDLE' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'STOPPED';

export interface AutopilotStep {
  id: string;
  stepNumber: number;
  phase: 'RECON' | 'ENUMERATION' | 'INVESTIGATION' | 'EXPLOITATION' | 'PRIVESC' | 'FLAG_CAPTURE';
  title: string;
  description: string;
  simulatedCommand: string;
  simulatedOutput: string;
  requiresMachineId: string;
  expectedFlag?: string;
  explanation: string;
}

export interface AiResponse {
  success: boolean;
  text?: string;
  error?: string;
  provider: AiProviderType;
  modelUsed?: string;
}
