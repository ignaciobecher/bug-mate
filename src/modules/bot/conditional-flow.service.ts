import { Inject, Injectable, Logger } from '@nestjs/common';
import type { IncomingMessage, MessageAdapter } from '../core/interfaces/message-adapter.interface';
import type { AIProvider } from '../core/interfaces/ai-provider.interface';
import { AI_PROVIDER } from '../core/tokens/injection-tokens';
import { BotConfigService } from '../config/bot-config.service';
import { ConfigLoaderService } from '../config/config-loader.service';
import { SessionService } from '../session/session.service';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { ValidateService } from './validate.service';
import { TrelloService } from '../trello/trello.service';
import type { ConversationSession } from '../session/session.types';
import type {
  ConditionalFlow,
  ConditionalFlowStep,
  MessageStep,
  InputStep,
  MenuStep,
  ValidateStep,
  AiStep,
  StepAction,
  TrelloCardConfig,
} from '../config/types/conditional-flow.types';

@Injectable()
export class ConditionalFlowService {
  private readonly logger = new Logger(ConditionalFlowService.name);

  constructor(
    @Inject(AI_PROVIDER) private readonly ai: AIProvider,
    private readonly botConfig: BotConfigService,
    private readonly configLoader: ConfigLoaderService,
    private readonly sessionService: SessionService,
    private readonly knowledgeService: KnowledgeService,
    private readonly validateService: ValidateService,
    private readonly trelloService: TrelloService,
  ) {}

  // ─── Entry points ─────────────────────────────────────────────

  /** Called by BotService when a menu option with conditionalFlowId is chosen */
  async startFlow(
    flowId: string,
    startStepOverride: string | undefined,
    session: ConversationSession,
    adapter: MessageAdapter,
  ): Promise<void> {
    const flow = this.getFlow(flowId);
    if (!flow) {
      this.logger.error(`Conditional flow "${flowId}" not found`);
      return;
    }

    const startStep = startStepOverride ?? flow.startStep;
    this.sessionService.startConditionalFlow(session.senderId, flowId, startStep);

    // Re-fetch session after mutation
    const { session: updated } = this.sessionService.getOrCreate(session.senderId);
    await this.executeStep(startStep, flow, updated, null, adapter);
  }

  /** Called by BotService when session state is CONDITIONAL_FLOW_ACTIVE */
  async handleStep(
    incoming: IncomingMessage,
    session: ConversationSession,
    adapter: MessageAdapter,
  ): Promise<void> {
    const flowId = session.activeConditionalFlowId;
    const stepId = session.activeStepId;

    if (!flowId || !stepId) {
      this.sessionService.reset(session.senderId);
      return;
    }

    const flow = this.getFlow(flowId);
    if (!flow) {
      this.logger.error(`Conditional flow "${flowId}" not found`);
      this.sessionService.reset(session.senderId);
      return;
    }

    const step = flow.steps[stepId];
    if (!step) {
      this.logger.error(`Step "${stepId}" not found in flow "${flowId}"`);
      this.sessionService.reset(session.senderId);
      return;
    }

    await this.processStepInput(stepId, step, flow, incoming, session, adapter);
  }

  // ─── Step execution (show prompt) ─────────────────────────────

  private async executeStep(
    stepId: string,
    flow: ConditionalFlow,
    session: ConversationSession,
    _incoming: IncomingMessage | null,
    adapter: MessageAdapter,
  ): Promise<void> {
    const step = flow.steps[stepId];
    if (!step) {
      this.logger.error(`Step "${stepId}" not found`);
      this.sessionService.reset(session.senderId);
      return;
    }

    const vars = this.buildVars(session, _incoming);

    switch (step.type) {
      case 'message':
        await this.executeMessageStep(stepId, step, flow, session, _incoming, adapter, vars);
        break;
      case 'input':
        await this.send(adapter, session.senderId, this.interpolate(step.prompt, vars));
        // Stay on this step — wait for user input
        break;
      case 'menu':
        await this.sendMenuStep(step, session, adapter, vars);
        // Stay on this step — wait for user input
        break;
      case 'validate':
        // validate steps don't send a prompt — they process the previous input immediately
        // This shouldn't be reached directly; validate is triggered by processStepInput
        break;
      case 'ai':
        await this.send(adapter, session.senderId, this.interpolate(step.inputPrompt, vars));
        // Stay on this step — wait for user input
        break;
    }
  }

  // ─── Step input processing (handle user response) ─────────────

  private async processStepInput(
    stepId: string,
    step: ConditionalFlowStep,
    flow: ConditionalFlow,
    incoming: IncomingMessage,
    session: ConversationSession,
    adapter: MessageAdapter,
  ): Promise<void> {
    switch (step.type) {
      case 'input':
        await this.processInputStep(stepId, step, flow, incoming, session, adapter);
        break;
      case 'menu':
        await this.processMenuStep(stepId, step, flow, incoming, session, adapter);
        break;
      case 'validate':
        await this.processValidateStep(stepId, step, flow, incoming, session, adapter);
        break;
      case 'ai':
        await this.processAiStep(stepId, step, flow, incoming, session, adapter);
        break;
      case 'message':
        // message steps are self-executing — shouldn't receive user input
        // but handle gracefully by re-executing
        await this.executeStep(stepId, flow, session, incoming, adapter);
        break;
    }
  }

  // ─── Message step ─────────────────────────────────────────────

  private async executeMessageStep(
    stepId: string,
    step: MessageStep,
    flow: ConditionalFlow,
    session: ConversationSession,
    incoming: IncomingMessage | null,
    adapter: MessageAdapter,
    vars: Record<string, string>,
  ): Promise<void> {
    await this.send(adapter, session.senderId, this.interpolate(step.text, vars));

    if (step.action) {
      await this.executeAction(step.action, step.notification, session, incoming, adapter, vars, step.trelloCard);
      if (this.isTerminalAction(step.action)) return;
    }

    await this.routeToNext(step.nextStep, flow, session, incoming, adapter);
  }

  // ─── Input step ───────────────────────────────────────────────

  private async processInputStep(
    _stepId: string,
    step: InputStep,
    flow: ConditionalFlow,
    incoming: IncomingMessage,
    session: ConversationSession,
    adapter: MessageAdapter,
  ): Promise<void> {
    let value: string;
    if (!incoming.text && incoming.mediaBase64 && step.acceptMedia) {
      value = step.mediaFallback ?? '[archivo adjunto]';
    } else if (incoming.text) {
      value = incoming.text.trim();
    } else {
      // No text and no media — re-prompt
      const vars = this.buildVars(session, incoming);
      await this.send(adapter, session.senderId, this.interpolate(step.prompt, vars));
      return;
    }

    this.sessionService.saveFlowVar(session.senderId, step.saveAs, value);

    // Re-fetch updated session
    const { session: updated } = this.sessionService.getOrCreate(session.senderId);
    await this.routeToNext(step.nextStep, flow, updated, incoming, adapter);
  }

  // ─── Menu step ────────────────────────────────────────────────

  private async sendMenuStep(
    step: MenuStep,
    session: ConversationSession,
    adapter: MessageAdapter,
    vars: Record<string, string>,
  ): Promise<void> {
    const optionLines = step.options.map((o) => `*${o.id}*. ${o.label}`);
    const text = `${this.interpolate(step.message, vars)}\n\n${optionLines.join('\n')}`;
    await this.send(adapter, session.senderId, text);
  }

  private async processMenuStep(
    _stepId: string,
    step: MenuStep,
    flow: ConditionalFlow,
    incoming: IncomingMessage,
    session: ConversationSession,
    adapter: MessageAdapter,
  ): Promise<void> {
    const input = incoming.text?.trim() ?? '';
    const vars = this.buildVars(session, incoming);

    const option = step.options.find(
      (o) =>
        o.id === input ||
        input.toLowerCase().includes(o.label.toLowerCase().slice(0, 12)),
    );

    if (!option) {
      await this.send(adapter, session.senderId, this.interpolate(step.invalidMessage, vars));
      return;
    }

    if (option.action) {
      await this.executeAction(option.action, option.notification, session, incoming, adapter, vars, option.trelloCard);
      if (this.isTerminalAction(option.action)) return;
    }

    if (option.nextStep) {
      await this.routeToNext(option.nextStep, flow, session, incoming, adapter);
    }
  }

  // ─── Validate step ────────────────────────────────────────────

  private async processValidateStep(
    _stepId: string,
    step: ValidateStep,
    flow: ConditionalFlow,
    incoming: IncomingMessage,
    session: ConversationSession,
    adapter: MessageAdapter,
  ): Promise<void> {
    const inputValue = session.flowData[step.inputVar];
    const inputStr = typeof inputValue === 'string' ? inputValue : String(inputValue ?? '');
    const vars = this.buildVars(session, incoming);

    const match = this.validateService.validate(step.dataSource, inputStr);

    if (match) {
      this.sessionService.saveFlowObject(session.senderId, step.onMatch.saveAs, match as unknown as Record<string, unknown>);
      const { session: updated } = this.sessionService.getOrCreate(session.senderId);
      await this.routeToNext(step.onMatch.nextStep, flow, updated, incoming, adapter);
    } else {
      if (step.onNoMatch.message) {
        await this.send(adapter, session.senderId, this.interpolate(step.onNoMatch.message, vars));
      }
      if (step.onNoMatch.action) {
        await this.executeAction(
          step.onNoMatch.action,
          step.onNoMatch.notification,
          session,
          incoming,
          adapter,
          vars,
        );
        if (this.isTerminalAction(step.onNoMatch.action)) return;
      }
      if (step.onNoMatch.nextStep) {
        await this.routeToNext(step.onNoMatch.nextStep, flow, session, incoming, adapter);
      }
    }
  }

  // ─── AI step ──────────────────────────────────────────────────

  private async processAiStep(
    _stepId: string,
    step: AiStep,
    flow: ConditionalFlow,
    incoming: IncomingMessage,
    session: ConversationSession,
    adapter: MessageAdapter,
  ): Promise<void> {
    const { identity, ai } = this.configLoader.botConfig;
    const vars = this.buildVars(session, incoming);

    const query = incoming.text?.trim();
    if (!query) {
      await this.send(adapter, session.senderId, this.interpolate(step.textOnlyMessage, vars));
      return;
    }

    const queryKey = step.saveQueryAs ?? 'userQuery';
    this.sessionService.saveFlowVar(session.senderId, queryKey, query);
    const { session: updated } = this.sessionService.getOrCreate(session.senderId);
    const updatedVars = this.buildVars(updated, incoming);

    const fallback = step.fallbackToEscalation ?? ai.fallbackToEscalation;

    let knowledgeResult: { content: string } | null = null;
    if (step.useKnowledge) {
      // Only search if the matched client has knowledge docs configured
      const matchedClient = session.flowData['matchedClient'];
      const allowedSources =
        matchedClient && typeof matchedClient === 'object'
          ? (matchedClient as Record<string, unknown>)['knowledgeDocs'] as string[] | undefined
          : undefined;

      if (allowedSources && allowedSources.length > 0) {
        knowledgeResult = await this.knowledgeService.search(query, allowedSources);
      }
      // If no knowledgeDocs configured → treat as no result (falls through to escalation below)
    }

    if (knowledgeResult) {
      const basePrompt = this.configLoader.interpolate(
        step.systemPromptOverride ?? ai.systemPrompt,
        { company: identity.company, developerName: identity.developerName, botName: identity.name, tone: identity.tone },
      );
      const systemPrompt =
        `${basePrompt}\n\nUsá esta información para responder:\n---\n${knowledgeResult.content}\n---\n` +
        (step.ragContextInstruction ?? '');

      const response = await this.ai.generate({ prompt: query, systemPrompt });
      this.sessionService.addToHistory(updated.senderId, 'assistant', response.text);
      await this.send(adapter, updated.senderId, response.text);
    } else if (step.useKnowledge && fallback) {
      if (step.noResultMessage) {
        await this.send(adapter, updated.senderId, this.interpolate(step.noResultMessage, updatedVars));
      }
      if (step.noResultNotification) {
        await this.send(
          adapter,
          this.botConfig.developerWhatsAppId,
          this.interpolate(step.noResultNotification, updatedVars),
        );
      }
      this.sessionService.setState(updated.senderId, 'ESCALATED');
      return;
    } else {
      const systemPrompt = this.configLoader.interpolate(
        step.systemPromptOverride ?? ai.systemPrompt,
        { company: identity.company, developerName: identity.developerName, botName: identity.name, tone: identity.tone },
      );
      const response = await this.ai.generate({ prompt: query, systemPrompt });
      this.sessionService.addToHistory(updated.senderId, 'assistant', response.text);
      await this.send(adapter, updated.senderId, response.text);
    }

    await this.send(adapter, updated.senderId, this.interpolate(step.continuePrompt, updatedVars));
    await this.routeToNext(step.nextStep, flow, updated, incoming, adapter);
  }

  // ─── Routing ──────────────────────────────────────────────────

  private async routeToNext(
    nextStep: string | 'END',
    flow: ConditionalFlow,
    session: ConversationSession,
    incoming: IncomingMessage | null,
    adapter: MessageAdapter,
  ): Promise<void> {
    if (nextStep === 'END') {
      this.sessionService.setState(session.senderId, 'IDLE');
      return;
    }

    if (nextStep === 'SHOW_MENU') {
      this.sessionService.setState(session.senderId, 'AWAITING_MENU_SELECTION');
      return;
    }

    const targetStep = flow.steps[nextStep];
    if (!targetStep) {
      this.logger.error(`Next step "${nextStep}" not found`);
      this.sessionService.reset(session.senderId);
      return;
    }

    this.sessionService.advanceConditionalStep(session.senderId, nextStep);
    const { session: updated } = this.sessionService.getOrCreate(session.senderId);

    // If next step is validate — process it immediately (no user input needed)
    if (targetStep.type === 'validate') {
      await this.processValidateStep(nextStep, targetStep, flow, incoming!, updated, adapter);
    } else {
      await this.executeStep(nextStep, flow, updated, incoming, adapter);
    }
  }

  // ─── Actions ──────────────────────────────────────────────────

  private async executeAction(
    action: StepAction,
    notificationTemplate: string | undefined,
    session: ConversationSession,
    incoming: IncomingMessage | null,
    adapter: MessageAdapter,
    vars: Record<string, string>,
    trelloCard?: TrelloCardConfig,
  ): Promise<void> {
    if (action === 'NOTIFY_DEVELOPER' || action === 'ESCALATE') {
      if (notificationTemplate) {
        await this.send(
          adapter,
          this.botConfig.developerWhatsAppId,
          this.interpolate(notificationTemplate, vars),
        );
      }
      if (action === 'ESCALATE') {
        const { escalation, identity } = this.configLoader.botConfig;
        await this.send(
          adapter,
          session.senderId,
          this.configLoader.interpolate(escalation.clientMessage, { developerName: identity.developerName }),
        );
        this.sessionService.setState(session.senderId, 'ESCALATED');
      }
    }

    if (trelloCard) {
      const listId = this.interpolate(trelloCard.listId, vars);
      const title = this.interpolate(trelloCard.title, vars);
      const description = this.interpolate(trelloCard.description, vars);
      await this.trelloService.createCard(listId, title, description);
    }

    if (action === 'END') {
      this.sessionService.setState(session.senderId, 'IDLE');
    }

    if (action === 'SHOW_MENU') {
      this.sessionService.setState(session.senderId, 'AWAITING_MENU_SELECTION');
    }
  }

  private isTerminalAction(action: StepAction): boolean {
    return action === 'ESCALATE' || action === 'END' || action === 'SHOW_MENU';
  }

  // ─── Variable interpolation ───────────────────────────────────

  /**
   * Builds the variable map for template interpolation.
   * Flattens object flowData entries (e.g. matchedClient.name) into top-level keys.
   */
  buildVars(session: ConversationSession, incoming: IncomingMessage | null): Record<string, string> {
    const { identity } = this.configLoader.botConfig;
    const senderPhone = session.senderId.replace('@c.us', '').replace('@lid', '');

    const vars: Record<string, string> = {
      senderPhone,
      clientName: session.clientName,
      timestamp: new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }),
      flowPath: session.flowPath.join(' → '),
      developerName: identity.developerName,
      company: identity.company,
      botName: identity.name,
    };

    // Flatten flowData: strings go directly, objects get dot-notation keys (recursive)
    const flatten = (prefix: string, obj: Record<string, unknown>) => {
      for (const [k, v] of Object.entries(obj)) {
        const fullKey = `${prefix}.${k}`;
        if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
          vars[fullKey] = String(v ?? '');
        } else if (v && typeof v === 'object') {
          flatten(fullKey, v as Record<string, unknown>);
        }
      }
    };

    for (const [key, value] of Object.entries(session.flowData)) {
      if (typeof value === 'string') {
        vars[key] = value;
      } else if (value && typeof value === 'object') {
        flatten(key, value as Record<string, unknown>);
      }
    }

    return vars;
  }

  private interpolate(template: string, vars: Record<string, string>): string {
    return template.replace(/\{([\w.]+)\}/g, (_, key: string) => vars[key] ?? `{${key}}`);
  }

  // ─── Helpers ──────────────────────────────────────────────────

  private getFlow(flowId: string): ConditionalFlow | null {
    return this.configLoader.botConfig.conditionalFlows?.[flowId] ?? null;
  }

  private async send(adapter: MessageAdapter, recipientId: string, text: string): Promise<void> {
    await adapter.sendMessage({ recipientId, text });
  }
}
