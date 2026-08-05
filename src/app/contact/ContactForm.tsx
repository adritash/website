"use client";

import { useState } from "react";
import PageHero from "@/components/sections/PageHero";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Section from "@/components/ui/Section";
import { contact, social } from "@/lib/site";

const contactDetails = [
  {
    label: "Email",
    value: contact.email,
    href: contact.emailHref,
    external: false,
  },
  {
    label: "Phone / WhatsApp",
    value: contact.phone,
    href: contact.phoneHref,
    external: false,
  },
  {
    label: "LinkedIn",
    value: "linkedin.com/in/dwaipayanrajguru",
    href: social.linkedin,
    external: true,
  },
  {
    label: "Credly Badges",
    value: "View my certifications",
    href: social.credly,
    external: true,
  },
];

const inputClass =
  "w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-ring";

export default function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setStatus("idle");
    setErrorMessage("");

    const form = e.currentTarget;
    const formData = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      subject: (form.elements.namedItem("subject") as HTMLInputElement).value,
      message: (form.elements.namedItem("message") as HTMLTextAreaElement).value,
      company: (form.elements.namedItem("company") as HTMLInputElement).value,
    };

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
      };

      if (!response.ok) {
        setErrorMessage(
          data.error ?? "Something went wrong. Please try again."
        );
        setStatus("error");
        return;
      }

      setStatus("success");
      form.reset();
    } catch {
      setErrorMessage(
        "Unable to connect. Please check your connection and try again."
      );
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Let's talk about your next project"
        description="Whether you have a defined project or just an idea to pressure-test, I'll be back in touch within one business day."
      />

      <Section background="white">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Start a conversation
            </h2>
            <p className="mt-4 leading-relaxed text-muted">
              I&apos;m happy to talk through architecture, cloud, or AI challenges —
              no sales pitch, just straight talk about what&apos;s realistic for your
              organisation.
            </p>

            <ul className="mt-8 space-y-3" aria-label="Contact details">
              {contactDetails.map((item) => (
                <li key={item.label}>
                  <Card className="!p-4" hover>
                    <a
                      href={item.href}
                      {...(item.external
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                      className="group flex items-center gap-4"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand transition-colors group-hover:bg-brand group-hover:text-white">
                        <ContactIcon label={item.label} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted">
                          {item.label}
                        </p>
                        <p className="mt-0.5 text-sm font-medium text-slate-900">
                          {item.value}
                        </p>
                      </div>
                    </a>
                  </Card>
                </li>
              ))}
            </ul>

            <dl className="mt-8 space-y-4 text-sm text-muted">
              <div>
                <dt className="font-semibold text-slate-900">Response time</dt>
                <dd>Within 24 hours on business days</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-900">Availability</dt>
                <dd>Open to new projects — let&apos;s align on timing</dd>
              </div>
            </dl>
          </div>

          <form
            className="space-y-6"
            onSubmit={handleSubmit}
            noValidate
            aria-label="Contact form"
          >
            <div className="hidden" aria-hidden="true">
              <label htmlFor="company">Company</label>
              <input
                id="company"
                name="company"
                type="text"
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="name"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Name <span className="text-red-600" aria-hidden="true">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  maxLength={100}
                  className={inputClass}
                  placeholder="Your name"
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Email <span className="text-red-600" aria-hidden="true">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  className={inputClass}
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="subject"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Subject <span className="text-red-600" aria-hidden="true">*</span>
              </label>
              <input
                id="subject"
                name="subject"
                type="text"
                required
                maxLength={150}
                className={inputClass}
                placeholder="What are you working on?"
              />
            </div>

            <div>
              <label
                htmlFor="message"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Message <span className="text-red-600" aria-hidden="true">*</span>
              </label>
              <textarea
                id="message"
                name="message"
                rows={5}
                required
                maxLength={5000}
                className={`${inputClass} resize-none`}
                placeholder="Describe your project or question..."
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? "Sending…" : "Send Message"}
            </Button>

            <div aria-live="polite" aria-atomic="true">
              {status === "success" && (
                <p
                  className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
                  role="status"
                >
                  Your message has been sent successfully. I&apos;ll be in touch soon.
                </p>
              )}
              {status === "error" && (
                <p
                  className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                  role="alert"
                >
                  {errorMessage}
                </p>
              )}
            </div>
          </form>
        </div>
      </Section>
    </>
  );
}

function ContactIcon({ label }: { label: string }) {
  if (label === "Email") {
    return (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
        />
      </svg>
    );
  }

  if (label === "Phone / WhatsApp") {
    return (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
        />
      </svg>
    );
  }

  return (
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
      />
    </svg>
  );
}
