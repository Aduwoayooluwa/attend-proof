import { SITE_URL } from './brand';

export function getTicketUrl(ticketToken: string) {
  return `${SITE_URL}/ticket/${ticketToken}`;
}
