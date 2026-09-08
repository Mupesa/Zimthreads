/**
 * WhatsApp Dispatch Utility for Zimthreads
 * Primary phone: +230 5513 2614
 *
 * Provides automated formatting and instant dispatch for:
 * 1. Shopping Bag Orders (Items, quantities, sizes, delivery address, payment method)
 * 2. Sneaker Care Bookings (Service, date, time slot, sneaker notes)
 * 3. Studio Inquiries
 */

export const WHATSAPP_PHONE = "23055132614"
export const FORMATTED_PHONE = "+230 5513 2614"

export interface OrderWhatsAppPayload {
  id: string
  customer: string
  phone: string
  email: string
  address: string
  city: string
  paymentMethod: string
  items: Array<{
    name: string
    quantity: number
    price: number
    size?: string
  }>
  totalAmount: number
  deliveryFee?: number
}

export interface BookingWhatsAppPayload {
  id: string
  customer: string
  phone: string
  email: string
  serviceName: string
  price: string
  date: string
  time: string
  notes?: string
}

/**
 * Formats a shopping bag order into a clean WhatsApp invoice message.
 */
export function formatOrderWhatsAppMessage(
  order: OrderWhatsAppPayload,
): string {
  const itemsText = order.items
    .map(
      (item) =>
        `• ${item.quantity}x ${item.name}${
          item.size ? ` (Size: ${item.size})` : ""
        } - Rs ${(item.price * item.quantity).toFixed(0)}`,
    )
    .join("\n")

  return `🛒 *NEW ZIMTHREAD ORDER*
*Ref:* #${order.id}

*Customer Details:*
• Name: ${order.customer}
• Phone: ${order.phone}
• Email: ${order.email}
• Delivery: ${order.address}, ${order.city}

*Items Ordered:*
${itemsText}

*Grand Total:* Rs ${order.totalAmount.toFixed(0)}
*Payment Method:* ${order.paymentMethod}

_Please confirm my order and share Juice / delivery details!_`
}

/**
 * Formats a shoe cleaning service booking into a clean WhatsApp dispatch message.
 */
export function formatBookingWhatsAppMessage(
  booking: BookingWhatsAppPayload,
): string {
  return `👟 *NEW SNEAKER CLEANING BOOKING*
*Ref:* #${booking.id}
*Service:* ${booking.serviceName} (${booking.price})
*Scheduled Date:* ${booking.date}
*Time Slot:* ${booking.time}

*Customer Details:*
• Name: ${booking.customer}
• Phone: ${booking.phone}
• Email: ${booking.email}
${booking.notes ? `• Sneaker Notes: "${booking.notes}"` : ""}

_Hi Zimthreads, I just booked this session online. Sending my sneaker photo here!_`
}

/**
 * Formats a contact inquiry message.
 */
export function formatInquiryWhatsAppMessage(inquiry: {
  name: string
  email: string
  subject: string
  message: string
}): string {
  return `💬 *NEW WEBSITE INQUIRY*
*From:* ${inquiry.name} (${inquiry.email})
*Subject:* ${inquiry.subject}

*Message:*
"${inquiry.message}"`
}

/**
 * Generates the full WhatsApp URL with encoded message payload.
 */
export function getWhatsAppUrl(
  message: string,
  phone: string = WHATSAPP_PHONE,
): string {
  const cleanPhone = normalizeWhatsAppNumber(phone)
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
}

/**
 * Normalizes phone numbers for WhatsApp wa.me links.
 * Handles 8-digit Mauritius mobile numbers starting with 5 by adding 230.
 */
export function normalizeWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  if (digits.length === 8 && digits.startsWith("5")) {
    return `230${digits}`
  }
  return digits || WHATSAPP_PHONE
}

/**
 * Safely opens a WhatsApp URL in a new window or tab.
 */
export function openWhatsApp(
  message: string,
  phone: string = WHATSAPP_PHONE,
): void {
  const url = getWhatsAppUrl(message, phone)
  window.open(url, "_blank", "noopener,noreferrer")
}
