import nodemailer from "nodemailer";
import { calculateNightCount, calculateStayPrice } from "@/lib/pricing";

type Address = {
  street: string;
  zip: string;
  city: string;
  country: string;
};

type BookingRoomData = {
  roomId: string;
  roomName: string;
  pricePerNight: number;
  numberOfGuests: number;
};

export type BookingData = {
  bookingId: string;
  checkIn: Date;
  checkOut: Date;
  totalPrice: number;
  company: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  message: string;
  guestAddress: Address;
  invoiceAddress?: Address;
  rooms: BookingRoomData[];
};

export type ContactData = {
  name: string;
  email: string;
  phone?: string;
  street: string;
  zip: string;
  city: string;
  message: string;
};

type MailEnv = {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  contactFrom: string;
  to: string;
  bookingTo: string;
  contactTo: string;
};

function getMailEnv(): MailEnv | null {
  const host = process.env.MAIL_HOST;
  const port = process.env.MAIL_PORT ? Number(process.env.MAIL_PORT) : NaN;
  const user = process.env.MAIL_USER;
  const pass = process.env.MAIL_PASS;
  const from = process.env.MAIL_FROM;
  const contactFrom = process.env.MAIL_CONTACT_FROM || from;
  const to = process.env.MAIL_TO;
  const bookingTo = process.env.MAIL_BOOKING_TO || to;
  const contactTo = process.env.MAIL_CONTACT_TO || to;

  if (
    !host ||
    !Number.isFinite(port) ||
    !user ||
    !pass ||
    !from ||
    !contactFrom ||
    !to ||
    !bookingTo ||
    !contactTo
  ) {
    return null;
  }

  return {
    host,
    port,
    user,
    pass,
    from,
    contactFrom,
    to,
    bookingTo,
    contactTo,
  };
}

export function hasMailConfig(): boolean {
  return getMailEnv() !== null;
}

function getTransporter() {
  const env = getMailEnv();

  if (!env) {
    throw new Error("Mail configuration is incomplete");
  }

  const transporter = nodemailer.createTransport({
    host: env.host,
    port: env.port,
    secure: env.port === 465,
    auth: {
      user: env.user,
      pass: env.pass,
    },
  });

  return { transporter, env };
}

function formatAddress(address: Address): string {
  return `${address.street}, ${address.zip} ${address.city}, ${address.country}`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return character;
    }
  });
}

function escapeHtmlWithBreaks(value: string): string {
  return escapeHtml(value).replace(/\r?\n/g, "<br />");
}

function normalizeHeaderValue(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function normalizeEmail(value: string): string {
  return normalizeHeaderValue(value).toLowerCase();
}

type SanitizedContactFields = {
  safeName: string;
  safeEmail: string;
  safePhone: string;
  safeAddress: string;
  safeMessage: string;
  normalizedNameHeader: string;
  normalizedEmail: string;
};

function getSanitizedContactFields(
  contact: ContactData,
): SanitizedContactFields {
  // Eine sanitizte/normalisierte Sicht vorbereiten, die beide Kontaktmail-Varianten wiederverwenden.
  return {
    safeName: escapeHtml(contact.name),
    safeEmail: escapeHtml(normalizeEmail(contact.email)),
    safePhone: escapeHtml(contact.phone ?? "-"),
    safeAddress: escapeHtml(
      `${contact.street}, ${contact.zip} ${contact.city}`,
    ),
    safeMessage: escapeHtmlWithBreaks(contact.message),
    normalizedNameHeader: normalizeHeaderValue(contact.name),
    normalizedEmail: normalizeEmail(contact.email),
  };
}

function formatAddressHtml(address: Address): string {
  return escapeHtml(formatAddress(address));
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatCurrency(value: number): string {
  return `${value.toFixed(2)} EUR`;
}

function buildRoomBreakdownRows(booking: BookingData): string {
  const nights = calculateNightCount(booking.checkIn, booking.checkOut);
  const breakdown = calculateStayPrice(nights);

  return booking.rooms
    .map((room, index) => {
      return `
        <tr>
          <td style="padding:8px;border:1px solid #ddd;">${index + 1}</td>
          <td style="padding:8px;border:1px solid #ddd;">${escapeHtml(room.roomName)}</td>
          <td style="padding:8px;border:1px solid #ddd;">${room.numberOfGuests}</td>
          <td style="padding:8px;border:1px solid #ddd;">${breakdown.months}M / ${breakdown.weeks}W / ${breakdown.nights}N</td>
          <td style="padding:8px;border:1px solid #ddd;">${formatCurrency(breakdown.total)}</td>
        </tr>
      `;
    })
    .join("");
}

function buildBookingHtml(booking: BookingData): string {
  const invoice = booking.invoiceAddress
    ? formatAddressHtml(booking.invoiceAddress)
    : "wie Aufenthaltsadresse";
  const safeBookingId = escapeHtml(booking.bookingId);
  const safeCompany = escapeHtml(booking.company);
  const safeGuestName = escapeHtml(booking.guestName);
  const safeGuestEmail = escapeHtml(normalizeEmail(booking.guestEmail));
  const safeGuestPhone = escapeHtml(booking.guestPhone);

  return `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111;">
      <h2>Buchungsdetails</h2>
      <p><strong>Buchungs-ID:</strong> ${safeBookingId}</p>
      <p><strong>Anreise:</strong> ${formatDate(booking.checkIn)}<br />
      <strong>Abreise:</strong> ${formatDate(booking.checkOut)}</p>

      <p><strong>Firma:</strong> ${safeCompany}<br />
      <strong>Ansprechpartner:</strong> ${safeGuestName}<br />
      <strong>E-Mail:</strong> ${safeGuestEmail}<br />
      <strong>Telefon:</strong> ${safeGuestPhone}</p>

      ${booking.message ? `<p><strong>Nachricht:</strong><br />${escapeHtmlWithBreaks(booking.message)}</p>` : ""}

      <p><strong>Aufenthaltsadresse:</strong> ${formatAddressHtml(booking.guestAddress)}<br />
      <strong>Rechnungsadresse:</strong> ${invoice}</p>

      <h3>Preisaufschluesselung pro Zimmer</h3>
      <table style="border-collapse:collapse;width:100%;margin-top:8px;">
        <thead>
          <tr>
            <th style="padding:8px;border:1px solid #ddd;text-align:left;">#</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:left;">Zimmer</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:left;">Gaeste</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:left;">Monate/Wochen/Naechte</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:left;">Preis</th>
          </tr>
        </thead>
        <tbody>
          ${buildRoomBreakdownRows(booking)}
        </tbody>
      </table>

      <p style="margin-top:16px;"><strong>Gesamtpreis:</strong> ${formatCurrency(booking.totalPrice)}</p>
    </div>
  `;
}

function buildBookingCustomerHtml(booking: BookingData): string {
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;">
      <p>Hallo ${escapeHtml(booking.guestName)},</p>
      <p>vielen Dank fuer Ihre Buchungsanfrage. Wir haben Ihre Anfrage erhalten und melden uns zeitnah bei Ihnen.</p>
      <p>Nachfolgend erhalten Sie eine Kopie Ihrer Buchungsanfrage:</p>
      ${buildBookingHtml(booking)}
    </div>
  `;
}

function buildBookingText(booking: BookingData): string {
  const nights = calculateNightCount(booking.checkIn, booking.checkOut);
  const breakdown = calculateStayPrice(nights);
  const roomLines = booking.rooms
    .map(
      (room, index) =>
        `${index + 1}. ${room.roomName} (${room.numberOfGuests} guests) - ${breakdown.months}M/${breakdown.weeks}W/${breakdown.nights}N = ${formatCurrency(breakdown.total)}`,
    )
    .join("\n");

  return [
    `Booking ID: ${booking.bookingId}`,
    `Check-in: ${formatDate(booking.checkIn)}`,
    `Check-out: ${formatDate(booking.checkOut)}`,
    `Company: ${booking.company}`,
    `Guest: ${booking.guestName}`,
    `Email: ${booking.guestEmail}`,
    `Phone: ${booking.guestPhone}`,
    booking.message ? `Message: ${booking.message}` : "",
    `Address: ${formatAddress(booking.guestAddress)}`,
    booking.invoiceAddress
      ? `Invoice Address: ${formatAddress(booking.invoiceAddress)}`
      : "Invoice Address: same as guest address",
    "",
    "Rooms:",
    roomLines,
    "",
    `Total: ${formatCurrency(booking.totalPrice)}`,
  ].join("\n");
}

function buildBookingCustomerText(booking: BookingData): string {
  return [
    `Hallo ${booking.guestName},`,
    "",
    "vielen Dank fuer Ihre Buchungsanfrage. Wir haben Ihre Anfrage erhalten und melden uns zeitnah bei Ihnen.",
    "",
    "Hier erhalten Sie eine Kopie Ihrer Buchungsanfrage:",
    "",
    buildBookingText(booking),
  ].join("\n");
}

export async function sendBookingConfirmation(
  booking: BookingData,
): Promise<void> {
  const { transporter, env } = getTransporter();
  const safeGuestEmail = normalizeEmail(booking.guestEmail);

  await transporter.sendMail({
    from: env.from,
    to: safeGuestEmail,
    subject: "Kopie Ihrer Buchungsanfrage - Monteurzimmer Nedic",
    text: buildBookingCustomerText(booking),
    html: buildBookingCustomerHtml(booking),
    replyTo: env.bookingTo,
  });
}

export async function sendBookingNotification(
  booking: BookingData,
): Promise<void> {
  const { transporter, env } = getTransporter();
  const safeGuestName = normalizeHeaderValue(booking.guestName);
  const safeGuestEmail = normalizeEmail(booking.guestEmail);

  await transporter.sendMail({
    from: env.from,
    to: env.bookingTo,
    subject: `Neue Buchungsanfrage: ${safeGuestName}`,
    text: buildBookingText(booking),
    html: buildBookingHtml(booking),
    replyTo: safeGuestEmail,
  });
}

export async function sendContactMail(contact: ContactData): Promise<void> {
  const { transporter, env } = getTransporter();
  const fields = getSanitizedContactFields(contact);

  const text = [
    "Neue Kontaktanfrage",
    "",
    `Name: ${contact.name}`,
    `E-Mail: ${contact.email}`,
    `Telefon: ${contact.phone ?? "-"}`,
    `Adresse: ${contact.street}, ${contact.zip} ${contact.city}`,
    "",
    "Nachricht:",
    contact.message,
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111;">
      <h2>Neue Kontaktanfrage</h2>
      <p><strong>Name:</strong> ${fields.safeName}<br />
      <strong>E-Mail:</strong> ${fields.safeEmail}<br />
      <strong>Telefon:</strong> ${fields.safePhone}<br />
      <strong>Adresse:</strong> ${fields.safeAddress}</p>
      <p><strong>Nachricht:</strong><br />${fields.safeMessage}</p>
    </div>
  `;

  await transporter.sendMail({
    from: env.contactFrom,
    to: env.contactTo,
    subject: `Neue Anfrage von ${fields.normalizedNameHeader}`,
    text,
    html,
    replyTo: fields.normalizedEmail,
  });
}

export async function sendContactConfirmation(
  contact: ContactData,
): Promise<void> {
  const { transporter, env } = getTransporter();
  const fields = getSanitizedContactFields(contact);

  const text = [
    `Hallo ${contact.name},`,
    "",
    "vielen Dank fuer Ihre Nachricht. Wir haben Ihre Kontaktanfrage erhalten.",
    "",
    "Hier ist die Kopie Ihres ausgefuellten Kontaktformulars:",
    `Name: ${contact.name}`,
    `E-Mail: ${contact.email}`,
    `Telefon: ${contact.phone ?? "-"}`,
    `Adresse: ${contact.street}, ${contact.zip} ${contact.city}`,
    "",
    "Ihre Nachricht:",
    contact.message,
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111;">
      <p>Hallo ${fields.safeName},</p>
      <p>vielen Dank fuer Ihre Nachricht. Wir haben Ihre Kontaktanfrage erhalten.</p>
      <p><strong>Hier ist die Kopie Ihres ausgefuellten Kontaktformulars:</strong></p>
      <p><strong>Name:</strong> ${fields.safeName}<br />
      <strong>E-Mail:</strong> ${fields.safeEmail}<br />
      <strong>Telefon:</strong> ${fields.safePhone}<br />
      <strong>Adresse:</strong> ${fields.safeAddress}</p>
      <p><strong>Ihre Nachricht:</strong><br />${fields.safeMessage}</p>
    </div>
  `;

  await transporter.sendMail({
    from: env.contactFrom,
    to: fields.normalizedEmail,
    subject: "Kopie Ihres Kontaktformulars - Monteurzimmer Nedic",
    text,
    html,
    replyTo: env.contactTo,
  });
}
