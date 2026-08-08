import { NextResponse } from "next/server";
import { Resend } from "resend";
import { applyRateLimit } from "@/lib/rate-limit";
import { contact } from "@/lib/site";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254;
const MAX_SUBJECT_LENGTH = 150;
const MAX_MESSAGE_LENGTH = 5000;
const MAX_CONTENT_LENGTH = 10_000;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const EMAIL_REGEX =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/;
const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL;
type ContactPayload = {
  name: unknown;
  email: unknown;
  subject: unknown;
  message: unknown;
  company?: unknown;
};

type ValidationResult =
  | { ok: false; error: string }
  | {
      ok: true;
      data: {
        name: string;
        email: string;
        subject: string;
        message: string;
      };
    };

function jsonError(
  message: string,
  status: number,
  headers?: HeadersInit
) {
  return NextResponse.json(
    { success: false, error: message },
    { status, headers }
  );
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeText(value: string) {
  return value.replace(/\r\n/g, "\n").trim();
}

function validateOrigin(request: Request) {
  const allowedOrigin = configuredOrigin || new URL(request.url).origin;

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  if (origin) {
    return origin === allowedOrigin;
  }

  if (referer) {
    try {
      return new URL(referer).origin === allowedOrigin;
    } catch {
      return false;
    }
  }

  return false;
}

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") || "unknown";
}

function validatePayload(payload: ContactPayload): ValidationResult {
  if (
    typeof payload.name !== "string" ||
    typeof payload.email !== "string" ||
    typeof payload.subject !== "string" ||
    typeof payload.message !== "string"
  ) {
    return { ok: false, error: "Invalid request payload." };
  }

  if (typeof payload.company === "string" && payload.company.trim() !== "") {
    return { ok: false, error: "Unable to process request." };
  }

  const name = normalizeText(payload.name);
  const email = normalizeText(payload.email).toLowerCase();
  const subject = normalizeText(payload.subject);
  const message = normalizeText(payload.message);

  if (!name || !email || !subject || !message) {
    return { ok: false, error: "All fields are required." };
  }

  if (name.length > MAX_NAME_LENGTH) {
    return { ok: false, error: "Name is too long." };
  }

  if (email.length > MAX_EMAIL_LENGTH || !EMAIL_REGEX.test(email)) {
    return { ok: false, error: "Email address is invalid." };
  }

  if (subject.length > MAX_SUBJECT_LENGTH) {
    return { ok: false, error: "Subject is too long." };
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return { ok: false, error: "Message is too long." };
  }

  return {
    ok: true,
    data: {
      name,
      email,
      subject,
      message,
    },
  };
}

export async function POST(request: Request) {
  try {
    if (!resend) {
      console.error("RESEND_API_KEY is not configured.");
      return jsonError("Service is temporarily unavailable.", 503);
    }

    const contentType = request.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("application/json")) {
      return jsonError("Unsupported content type.", 415);
    }

    const contentLength = Number(request.headers.get("content-length") || "0");
    if (contentLength > MAX_CONTENT_LENGTH) {
      return jsonError("Request payload is too large.", 413);
    }

    if (!validateOrigin(request)) {
      return jsonError("Request origin is not allowed.", 403);
    }

    const clientIp = getClientIp(request);
    const rateLimit = await applyRateLimit({
      key: `contact:${clientIp}`,
      limit: RATE_LIMIT_MAX_REQUESTS,
      windowMs: RATE_LIMIT_WINDOW_MS,
    });
    const rateLimitHeaders = {
      "Retry-After": String(rateLimit.retryAfterSeconds),
      "X-RateLimit-Limit": String(RATE_LIMIT_MAX_REQUESTS),
      "X-RateLimit-Remaining": String(rateLimit.remaining),
    };

    if (!rateLimit.allowed) {
      return jsonError(
        "Too many requests. Please try again later.",
        429,
        rateLimitHeaders
      );
    }

    const validation = validatePayload((await request.json()) as ContactPayload);
    if (!validation.ok) {
      return jsonError(validation.error, 400);
    }

    const { name, email, subject, message } = validation.data;
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeSubject = subject.replace(/[\r\n]+/g, " ").trim();
    const safeMessageHtml = escapeHtml(message).replace(/\n/g, "<br>");
    const plainTextMessage = message;

    const [notificationResult, confirmationResult] = await Promise.all([
      resend.emails.send({
        from: "Adritash <contact@adritash.com>",
        to: process.env.CONTACT_EMAIL ?? contact.email,
        replyTo: email,
        subject: `[Website] ${safeSubject}`,
        text: [
          "New Contact Form Submission",
          `Name: ${name}`,
          `Email: ${email}`,
          "",
          "Message:",
          plainTextMessage,
        ].join("\n"),
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${safeName}</p>
          <p><strong>Email:</strong> ${safeEmail}</p>
          <hr>
          <p><strong>Message:</strong></p>
          <p>${safeMessageHtml}</p>
        `,
      }),
      resend.emails.send({
        from: "Adritash <contact@adritash.com>",
        to: email,
        subject: "Thank you for contacting Adritash",
        text: [
          `Hi ${name},`,
          "",
          "Thank you for reaching out through my website.",
          "I have received your message and will get back to you as soon as possible.",
          "",
          "Regards,",
          "Dwaipayan Rajguru",
        ].join("\n"),
        html: `
          <h2>Hi ${safeName},</h2>
          <p>Thank you for reaching out through my website.</p>
          <p>I have received your message and will get back to you as soon as possible.</p>
          <p>Regards,<br> Dwaipayan Rajguru</p>
        `,
      }),
    ]);

    if (notificationResult.error || confirmationResult.error) {
      console.error("Resend error:", notificationResult.error ?? confirmationResult.error);
      return jsonError("Unable to send email.", 500);
    }

    return NextResponse.json({
      success: true,
      message: "Email sent successfully.",
    }, {
      headers: rateLimitHeaders,
    });
  } catch (error) {
    console.error(error);

    return jsonError("Unable to send email.", 500);
  }
}
