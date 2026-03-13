/**
 * Injection tokens for interface-based dependency injection.
 * Using string tokens allows NestJS to inject the correct
 * implementation without coupling to a concrete class.
 */
export const AI_PROVIDER = 'AI_PROVIDER';
export const MESSAGE_ADAPTER = 'MESSAGE_ADAPTER';
export const TICKET_PROVIDER = 'TICKET_PROVIDER';
