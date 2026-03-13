export type MediaType = 'image' | 'audio' | 'video' | 'document' | 'sticker';

export interface IncomingMessage {
  senderId: string;
  text: string;
  channel: string;
  /** Present when the message contains media */
  mediaType?: MediaType;
  /** Base64-encoded media data */
  mediaBase64?: string;
  /** MIME type, e.g. 'image/jpeg', 'audio/ogg' */
  mediaMimeType?: string;
  raw?: unknown;
}

export interface OutgoingMessage {
  recipientId: string;
  text: string;
}

export interface MessageAdapter {
  readonly channelName: string;
  initialize(): Promise<void>;
  sendMessage(message: OutgoingMessage): Promise<void>;
}
