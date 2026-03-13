/**
 * Represents a support ticket to be created.
 */
export interface CreateTicketRequest {
  title: string;
  description: string;
  /** Identifier of the reporter (e.g. phone number) */
  reporterId: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Represents a created ticket.
 */
export interface Ticket {
  id: string;
  url?: string;
  title: string;
}

/**
 * Generic ticket provider interface.
 * Implement this interface to add support for Trello, Jira, Linear, etc.
 */
export interface TicketProvider {
  readonly providerName: string;
  createTicket(request: CreateTicketRequest): Promise<Ticket>;
}
