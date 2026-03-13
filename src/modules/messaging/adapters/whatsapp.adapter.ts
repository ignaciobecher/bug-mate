import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Client, LocalAuth, Message, MessageTypes } from 'whatsapp-web.js';
import * as qrcode from 'qrcode-terminal';
import type { MessageAdapter, IncomingMessage, OutgoingMessage, MediaType } from '../../core/interfaces/message-adapter.interface';
import { BotService } from '../../bot/bot.service';
import { ConfigLoaderService } from '../../config/config-loader.service';

@Injectable()
export class WhatsAppAdapter implements MessageAdapter, OnApplicationBootstrap {
  readonly channelName = 'WhatsApp';
  private readonly logger = new Logger(WhatsAppAdapter.name);
  private client: Client;

  constructor(
    private readonly botService: BotService,
    private readonly configLoader: ConfigLoaderService,
  ) {
    this.client = new Client({
      authStrategy: new LocalAuth({ dataPath: './.wwebjs_auth' }),
      puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
    });
  }

  async onApplicationBootstrap(): Promise<void> {
    await this.initialize();
  }

  async initialize(): Promise<void> {
    this.logger.log('Initializing WhatsApp adapter...');

    this.client.on('qr', (qr) => {
      this.logger.log('QR code received — scan it with your phone:');
      qrcode.generate(qr, { small: true });
    });

    this.client.on('ready', () => {
      this.logger.log('WhatsApp client is ready!');
    });

    this.client.on('authenticated', () => {
      this.logger.log('WhatsApp authentication successful');
    });

    this.client.on('auth_failure', (msg) => {
      this.logger.error(`Authentication failed: ${msg}`);
    });

    this.client.on('disconnected', (reason) => {
      this.logger.warn(`Disconnected: ${reason}`);
    });

    this.client.on('message', async (message: Message) => {
      await this.handleIncomingMessage(message);
    });

    await this.client.initialize();
  }

  async sendMessage(message: OutgoingMessage): Promise<void> {
    try {
      await this.simulateTyping(message.recipientId, message.text);
      await this.client.sendMessage(message.recipientId, message.text);
      this.logger.debug(`Sent to ${message.recipientId}`);
    } catch (error) {
      this.logger.error(`Failed to send to ${message.recipientId}: ${(error as Error).message}`);
      throw error;
    }
  }

  private async simulateTyping(recipientId: string, text: string): Promise<void> {
    const { humanDelay } = this.configLoader.botConfig;
    if (!humanDelay.enabled) return;

    const typingMs = Math.min(
      Math.max(text.length * humanDelay.msPerCharacter, humanDelay.minDelayMs),
      humanDelay.maxDelayMs,
    );

    try {
      const chat = await this.client.getChatById(recipientId);
      await chat.sendStateTyping();
      await new Promise((resolve) => setTimeout(resolve, typingMs));
      await chat.clearState();
    } catch {
      await new Promise((resolve) => setTimeout(resolve, typingMs));
    }
  }

  private async handleIncomingMessage(message: Message): Promise<void> {
    if (message.fromMe || message.from.endsWith('@g.us')) return;

    const incoming = await this.buildIncomingMessage(message);

    this.logger.debug(
      `Incoming [${incoming.mediaType ?? 'text'}] from ${incoming.senderId}: "${(incoming.text || '').slice(0, 60)}"`,
    );

    try {
      await this.botService.handleMessage(incoming, this);
    } catch (error) {
      this.logger.error(`Error handling message: ${(error as Error).message}`);
    }
  }

  private async buildIncomingMessage(message: Message): Promise<IncomingMessage> {
    const base: IncomingMessage = {
      senderId: message.from,
      text: message.body ?? '',
      channel: this.channelName,
      raw: message,
    };

    const { media: mediaConfig } = this.configLoader.botConfig;

    if (message.type === MessageTypes.IMAGE && mediaConfig.processImages) {
      return this.enrichWithMedia(base, message, 'image');
    }

    if (
      (message.type === MessageTypes.AUDIO || message.type === MessageTypes.VOICE) &&
      mediaConfig.processAudio
    ) {
      return this.enrichWithMedia(base, message, 'audio');
    }

    if (
      message.type === MessageTypes.VIDEO ||
      message.type === MessageTypes.DOCUMENT ||
      message.type === MessageTypes.STICKER
    ) {
      const typeLabels: Partial<Record<string, string>> = {
        video: 'video',
        document: 'documento',
        sticker: 'sticker',
      };
      const label = typeLabels[message.type] ?? message.type;
      return {
        ...base,
        text: mediaConfig.unsupportedMessage.replace('{mediaType}', label),
        mediaType: message.type as MediaType,
      };
    }

    return base;
  }

  private async enrichWithMedia(
    base: IncomingMessage,
    message: Message,
    type: MediaType,
  ): Promise<IncomingMessage> {
    try {
      const media = await message.downloadMedia();
      if (!media) return base;
      return {
        ...base,
        mediaType: type,
        mediaBase64: media.data,
        mediaMimeType: media.mimetype,
      };
    } catch (error) {
      this.logger.warn(`Could not download media: ${(error as Error).message}`);
      return base;
    }
  }
}
