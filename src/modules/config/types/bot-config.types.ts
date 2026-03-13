export interface BotIdentity {
  name: string;
  company: string;
  developerName: string;
  tone: string;
}

export interface GreetingConfig {
  enabled: boolean;
  message: string;
  unknownClientName: string;
  sessionTimeoutMinutes: number;
}

export interface MenuOption {
  id: string;
  label: string;
  action: 'REPORT_ERROR' | 'QUERY_KNOWLEDGE' | 'ESCALATE' | string;
}

export interface MenuConfig {
  message: string;
  invalidChoiceMessage: string;
  unrecognizedOptionMessage: string;
  options: MenuOption[];
}

export interface FlowStep {
  key: string;
  prompt: string;
}

export interface ReportErrorFlow {
  steps: FlowStep[];
  noScreenshotFallback: string;
  confirmationMessage: string;
  developerNotification: string;
}

export interface QueryKnowledgeFlow {
  inputPrompt: string;
  textOnlyMessage: string;
  noResultMessage: string;
  noResultDeveloperNotification: string;
  ragContextInstruction: string;
  continuePrompt: string;
  resultPrefix: string;
}

export interface FlowsConfig {
  reportError: ReportErrorFlow;
  queryKnowledge: QueryKnowledgeFlow;
}

export interface AiConfig {
  model: string;
  embeddingModel: string;
  systemPrompt: string;
  ragMinScore: number;
  ragTopK: number;
  fallbackToEscalation: boolean;
  maxHistoryMessages: number;
}

export interface HumanDelayConfig {
  enabled: boolean;
  readingDelayMinMs: number;
  readingDelayMaxMs: number;
  minDelayMs: number;
  maxDelayMs: number;
  msPerCharacter: number;
}

export interface MediaConfig {
  processImages: boolean;
  processAudio: boolean;
  imagePrompt: string;
  audioPrompt: string;
  unsupportedMessage: string;
}

export interface EscalationConfig {
  keywords: string[];
  clientMessage: string;
  developerNotification: string;
  alreadyEscalatedMessage: string;
}

export interface BotConfig {
  identity: BotIdentity;
  greeting: GreetingConfig;
  menu: MenuConfig;
  flows: FlowsConfig;
  humanDelay: HumanDelayConfig;
  ai: AiConfig;
  media: MediaConfig;
  escalation: EscalationConfig;
}

export interface ClientConfig {
  phone: string;
  name: string;
  company: string;
  systems: string[];
  notes?: string;
}

export interface KnowledgeEntry {
  id: string;
  tags: string[];
  question: string;
  answer: string;
  steps?: string[];
}
