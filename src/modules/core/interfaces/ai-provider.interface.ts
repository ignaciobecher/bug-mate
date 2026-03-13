export interface AIGenerateRequest {
  prompt: string;
  systemPrompt?: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  /** Base64-encoded image data for vision requests */
  imageBase64?: string;
  /** MIME type of the image (e.g. 'image/jpeg') */
  imageMimeType?: string;
}

export interface AIGenerateResponse {
  text: string;
  metadata?: Record<string, unknown>;
}

export interface AIProvider {
  readonly providerName: string;
  generate(request: AIGenerateRequest): Promise<AIGenerateResponse>;
}
