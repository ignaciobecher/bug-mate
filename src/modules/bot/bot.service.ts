import { Inject, Injectable, Logger } from '@nestjs/common';
import type { IncomingMessage, MessageAdapter } from '../core/interfaces/message-adapter.interface';
import type { AIProvider } from '../core/interfaces/ai-provider.interface';
import { AI_PROVIDER } from '../core/tokens/injection-tokens';
import { BotConfigService } from '../config/bot-config.service';
import { ConfigLoaderService } from '../config/config-loader.service';
import { SessionService } from '../session/session.service';
import { KnowledgeService } from '../knowledge/knowledge.service';
import type { ConversationSession } from '../session/session.types';

@Injectable()
export class BotService {
  private readonly logger = new Logger(BotService.name);

  constructor(
    @Inject(AI_PROVIDER) private readonly ai: AIProvider,
    private readonly botConfig: BotConfigService,
    private readonly configLoader: ConfigLoaderService,
    private readonly sessionService: SessionService,
    private readonly knowledgeService: KnowledgeService,
  ) {}

  async handleMessage(incoming: IncomingMessage, adapter: MessageAdapter): Promise<void> {
    this.logger.log(`[${adapter.channelName}] Message from ${incoming.senderId}`);

    const { session, isNew } = this.sessionService.getOrCreate(incoming.senderId);
    this.sessionService.addToHistory(incoming.senderId, 'user', incoming.text || '[media]');

    if (isNew || session.state === 'IDLE') {
      await this.sendGreetingAndMenu(session, adapter);
      return;
    }

    if (session.state === 'AWAITING_MENU_SELECTION') {
      await this.handleMenuSelection(incoming, session, adapter);
      return;
    }

    if (session.state === 'FLOW_REPORT_ERROR') {
      await this.handleReportErrorFlow(incoming, session, adapter);
      return;
    }

    if (session.state === 'FLOW_QUERY_KNOWLEDGE') {
      await this.handleQueryKnowledgeFlow(incoming, session, adapter);
      return;
    }

    if (session.state === 'ESCALATED') {
      await this.send(adapter, session.senderId,
        `Tu consulta ya fue enviada a *${this.configLoader.botConfig.identity.developerName}*. ` +
        `En cuanto pueda se va a comunicar con vos. 🙏`,
      );
      return;
    }
  }

  // ─── Greeting ────────────────────────────────────────────────

  private async sendGreetingAndMenu(
    session: ConversationSession,
    adapter: MessageAdapter,
  ): Promise<void> {
    const { greeting, identity, menu } = this.configLoader.botConfig;

    const greetingText = this.configLoader.interpolate(greeting.message, {
      clientName: session.clientName,
      company: identity.company,
      botName: identity.name,
    });

    const menuText = this.buildMenuText(
      menu.message,
      menu.options.map((o) => `*${o.id}*. ${o.label}`),
    );

    await this.send(adapter, session.senderId, `${greetingText}\n\n${menuText}`);
    this.sessionService.setState(session.senderId, 'AWAITING_MENU_SELECTION');
  }

  private buildMenuText(header: string, options: string[]): string {
    return `${header}\n\n${options.join('\n')}`;
  }

  // ─── Menu selection ──────────────────────────────────────────

  private async handleMenuSelection(
    incoming: IncomingMessage,
    session: ConversationSession,
    adapter: MessageAdapter,
  ): Promise<void> {
    const { menu } = this.configLoader.botConfig;
    const input = incoming.text?.trim();

    if (this.shouldEscalate(input)) {
      await this.escalate(incoming, session, adapter);
      return;
    }

    const option = menu.options.find(
      (o) =>
        o.id === input ||
        input?.toLowerCase().includes(o.label.toLowerCase().slice(2, 10)),
    );

    if (!option) {
      const menuText = this.buildMenuText(
        `No entendí tu respuesta. ${menu.message}`,
        menu.options.map((o) => `*${o.id}*. ${o.label}`),
      );
      await this.send(adapter, session.senderId, menuText);
      return;
    }

    switch (option.action) {
      case 'REPORT_ERROR':
        await this.startReportErrorFlow(session, adapter);
        break;
      case 'QUERY_KNOWLEDGE':
        await this.startQueryKnowledgeFlow(session, adapter);
        break;
      case 'ESCALATE':
        await this.escalate(incoming, session, adapter);
        break;
      default:
        await this.send(adapter, session.senderId, `Opción no reconocida.`);
    }
  }

  // ─── Flow: Report Error ──────────────────────────────────────

  private async startReportErrorFlow(
    session: ConversationSession,
    adapter: MessageAdapter,
  ): Promise<void> {
    const { steps } = this.configLoader.botConfig.flows.reportError;
    this.sessionService.setState(session.senderId, 'FLOW_REPORT_ERROR');
    await this.send(adapter, session.senderId, steps[0].prompt);
  }

  private async handleReportErrorFlow(
    incoming: IncomingMessage,
    session: ConversationSession,
    adapter: MessageAdapter,
  ): Promise<void> {
    const { steps, confirmationMessage, developerNotification } =
      this.configLoader.botConfig.flows.reportError;

    const currentStep = steps[session.flowStep];
    const value =
      incoming.text ||
      (incoming.mediaBase64 ? '[imagen adjunta]' : '[media]');

    this.sessionService.advanceFlowStep(session.senderId, currentStep.key, value);

    const nextStepIndex = session.flowStep; // already advanced by advanceFlowStep
    if (nextStepIndex < steps.length) {
      await this.send(adapter, session.senderId, steps[nextStepIndex].prompt);
      return;
    }

    // All steps complete — notify developer
    const vars = {
      clientName: session.clientName,
      clientPhone: incoming.senderId.replace('@c.us', '').replace('@lid', ''),
      developerName: this.configLoader.botConfig.identity.developerName,
      description: session.flowData['description'] ?? '-',
      screenshot: session.flowData['screenshot'] ?? 'No adjuntó captura',
    };

    await this.send(
      adapter,
      this.botConfig.developerWhatsAppId,
      this.configLoader.interpolate(developerNotification, vars),
    );

    await this.send(
      adapter,
      session.senderId,
      this.configLoader.interpolate(confirmationMessage, vars),
    );

    this.sessionService.setState(session.senderId, 'IDLE');
  }

  // ─── Flow: Query Knowledge ───────────────────────────────────

  private async startQueryKnowledgeFlow(
    session: ConversationSession,
    adapter: MessageAdapter,
  ): Promise<void> {
    this.sessionService.setState(session.senderId, 'FLOW_QUERY_KNOWLEDGE');
    await this.send(
      adapter,
      session.senderId,
      this.configLoader.botConfig.flows.queryKnowledge.inputPrompt,
    );
  }

  private async handleQueryKnowledgeFlow(
    incoming: IncomingMessage,
    session: ConversationSession,
    adapter: MessageAdapter,
  ): Promise<void> {
    const { queryKnowledge } = this.configLoader.botConfig.flows;
    const { identity, ai } = this.configLoader.botConfig;

    const query = incoming.text?.trim();
    if (!query) {
      await this.send(adapter, session.senderId, 'Por favor escribí tu consulta con texto.');
      return;
    }

    const knowledgeResult = await this.knowledgeService.search(query);

    if (knowledgeResult) {
      const systemPrompt =
        this.configLoader.interpolate(ai.systemPrompt, {
          company: identity.company,
          developerName: identity.developerName,
          botName: identity.name,
          tone: identity.tone,
        }) +
        `\n\nUsá esta información para responder:\n---\n${knowledgeResult.content}\n---\n` +
        `Respondé de forma natural y conversacional.`;

      const response = await this.ai.generate({ prompt: query, systemPrompt });
      this.sessionService.addToHistory(session.senderId, 'assistant', response.text);
      await this.send(adapter, session.senderId, response.text);
    } else if (ai.fallbackToEscalation) {
      const noResultMsg = this.configLoader.interpolate(queryKnowledge.noResultMessage, {
        developerName: identity.developerName,
      });
      await this.send(adapter, session.senderId, noResultMsg);

      await this.send(
        adapter,
        this.botConfig.developerWhatsAppId,
        `❓ *Consulta sin respuesta en base de conocimiento*\n\n` +
        `📱 *Cliente:* ${session.clientName} (${incoming.senderId.replace('@c.us', '')})\n` +
        `💬 *Consulta:* "${query}"`,
      );

      this.sessionService.setState(session.senderId, 'ESCALATED');
      return;
    } else {
      const response = await this.ai.generate({ prompt: query });
      this.sessionService.addToHistory(session.senderId, 'assistant', response.text);
      await this.send(adapter, session.senderId, response.text);
    }

    await this.send(
      adapter,
      session.senderId,
      `¿Hay algo más en lo que pueda ayudarte? Respondé *menú* para ver las opciones o escribí tu consulta.`,
    );
    this.sessionService.setState(session.senderId, 'IDLE');
  }

  // ─── Escalation ──────────────────────────────────────────────

  private shouldEscalate(text: string | undefined): boolean {
    if (!text) return false;
    const normalized = text.toLowerCase();
    return this.configLoader.botConfig.escalation.keywords.some((kw) =>
      normalized.includes(kw.toLowerCase()),
    );
  }

  private async escalate(
    incoming: IncomingMessage,
    session: ConversationSession,
    adapter: MessageAdapter,
  ): Promise<void> {
    const { escalation, identity } = this.configLoader.botConfig;

    await this.send(
      adapter,
      session.senderId,
      this.configLoader.interpolate(escalation.clientMessage, {
        developerName: identity.developerName,
      }),
    );

    await this.send(
      adapter,
      this.botConfig.developerWhatsAppId,
      this.configLoader.interpolate(escalation.developerNotification, {
        clientName: session.clientName,
        clientPhone: incoming.senderId.replace('@c.us', '').replace('@lid', ''),
        message: incoming.text || '[media]',
      }),
    );

    this.sessionService.setState(session.senderId, 'ESCALATED');
    this.logger.log(`Escalated ${session.senderId} to developer`);
  }

  // ─── Helpers ─────────────────────────────────────────────────

  private async send(adapter: MessageAdapter, recipientId: string, text: string): Promise<void> {
    await adapter.sendMessage({ recipientId, text });
  }
}
