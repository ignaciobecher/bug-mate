export type ConversationState =
  | 'IDLE'
  | 'AWAITING_MENU_SELECTION'
  | 'FLOW_REPORT_ERROR'
  | 'FLOW_QUERY_KNOWLEDGE'
  | 'ESCALATED';

export interface FlowData {
  [key: string]: string;
}

export interface ConversationSession {
  senderId: string;
  clientName: string;
  state: ConversationState;
  /** Current step index within a multi-step flow */
  flowStep: number;
  /** Data collected during a flow */
  flowData: FlowData;
  /** Conversation history for AI context */
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  lastActivityAt: Date;
}
