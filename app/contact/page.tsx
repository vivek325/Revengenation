import type { Metadata } from "next";
import Link from "next/link";
import { Mail, PlayCircle, Globe } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us – RevengeNation Stories",
  description: "Get in touch with RevengeNation Stories for inquiries, story submissions, partnerships, or feedback.",
};

const EMAIL = "contact@revengenationstories.com";

export default function ContactPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Contact Us</h1>
      <p className="text-sm text-slate-500 dark:text-[#64748B] mb-10">
        We&apos;d love to hear from you. Whether you have a question about our content, want to share your story,
        have a partnership inquiry, or just need someone to point you in the right direction — reach out.
      </p>

      <div className="space-y-6">

        {/* Cards grid */}
        <div className="grid sm:grid-cols-2 gap-4">

          <Card
            title="General Inquiries"
            description="We aim to respond to all emails within 48 hours. We're a small team and we read every message personally."
            action={{ label: EMAIL, href: `mailto:${EMAIL}` }}
            icon={<Mail size={18} className="text-[#E11D48]" />}
          />

          <Card
            title="Submit Your Story"
            description='Have a story to share? Email us with subject "Story Submission" — or use the submit page. All stories are published anonymously by default.'
            action={{ label: "Submit Your Story →", href: "/submit" }}
            icon={<Mail size={18} className="text-[#E11D48]" />}
            internal
          />

          <Card
            title="Business & Partnerships"
            description='Interested in advertising, sponsorship, affiliate partnerships, or media collaborations? Email us with subject "Partnership Inquiry."'
            action={{ label: EMAIL, href: `mailto:${EMAIL}?subject=Partnership Inquiry` }}
            icon={<Globe size={18} className="text-[#E11D48]" />}
          />

          <Card
            title="YouTube Channel"
            description='Our YouTube channel is the other half of what we do. For collaborations or content requests, include "YouTube" in your subject line.'
            action={{ label: "RevengeNation on YouTube →", href: "https://www.youtube.com/@RevengeNation1" }}
            icon={<PlayCircle size={18} className="text-[#E11D48]" />}
          />

        </div>

        {/* Feedback */}
        <div className="p-5 rounded-xl bg-slate-50 dark:bg-[#0A0C14] border border-slate-200 dark:border-[#1C2035]">
          <h2 className="text-sm font-black text-slate-800 dark:text-white mb-2">Feedback &amp; Corrections</h2>
          <p className="text-sm text-slate-500 dark:text-[#64748B] mb-3">
            If you notice an error in any of our articles, have feedback on our content, or want to suggest a topic
            for a future post or video — we genuinely want to hear from you.
          </p>
          <a
            href={`mailto:${EMAIL}?subject=Feedback`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#E11D48] hover:underline"
          >
            <Mail size={14} />
            {EMAIL}
          </a>
        </div>

        {/* Professional advice note */}
        <div className="p-5 rounded-xl bg-rose-50 dark:bg-[#E11D48]/5 border border-rose-200 dark:border-[#E11D48]/20">
          <h2 className="text-sm font-black text-rose-700 dark:text-[#F87171] mb-2">A Note on Professional Advice</h2>
          <p className="text-sm text-slate-500 dark:text-[#64748B]">
            RevengeNation Stories provides educational content and personal stories. We are not licensed therapists,
            attorneys, or financial advisors. If you are in crisis, experiencing mental health distress, or need
            legal or financial guidance, please consult a qualified professional in your area.
          </p>
          <p className="text-sm text-slate-500 dark:text-[#64748B] mt-2">
            If you are experiencing thoughts of self-harm or suicide, please contact your local emergency services
            or a crisis helpline immediately.
          </p>
        </div>

        {/* Connect */}
        <div className="p-5 rounded-xl bg-slate-50 dark:bg-[#0A0C14] border border-slate-200 dark:border-[#1C2035]">
          <h2 className="text-sm font-black text-slate-800 dark:text-white mb-3">Connect With Us</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-3 text-slate-500 dark:text-[#64748B]">
              <Globe size={15} className="text-[#E11D48] shrink-0" />
              <a href="https://revengenationstories.com" className="hover:text-[#E11D48] transition-colors">revengenationstories.com</a>
            </div>
            <div className="flex items-center gap-3 text-slate-500 dark:text-[#64748B]">
              <PlayCircle size={15} className="text-[#E11D48] shrink-0" />
              <a href="https://www.youtube.com/@RevengeNation1" target="_blank" rel="noopener noreferrer" className="hover:text-[#E11D48] transition-colors">youtube.com/@RevengeNation1</a>
            </div>
            <div className="flex items-center gap-3 text-slate-500 dark:text-[#64748B]">
              <Mail size={15} className="text-[#E11D48] shrink-0" />
              <a href={`mailto:${EMAIL}`} className="hover:text-[#E11D48] transition-colors">{EMAIL}</a>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-slate-400 dark:text-[#475569] pt-2">
          Thank you for being part of the RevengeNation community. Your trust means everything to us.
        </p>

      </div>
    </main>
  );
}

function Card({
  title, description, action, icon, internal = false,
}: {
  title: string;
  description: string;
  action: { label: string; href: string };
  icon: React.ReactNode;
  internal?: boolean;
}) {
  return (
    <div className="p-5 rounded-xl bg-slate-50 dark:bg-[#0A0C14] border border-slate-200 dark:border-[#1C2035] flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        {icon}
        <h2 className="text-sm font-black text-slate-800 dark:text-white">{title}</h2>
      </div>
      <p className="text-xs text-slate-500 dark:text-[#64748B] flex-1">{description}</p>
      {internal ? (
        <Link href={action.href} className="text-xs font-semibold text-[#E11D48] hover:underline">
          {action.label}
        </Link>
      ) : (
        <a
          href={action.href}
          target={action.href.startsWith("http") ? "_blank" : undefined}
          rel={action.href.startsWith("http") ? "noopener noreferrer" : undefined}
          className="text-xs font-semibold text-[#E11D48] hover:underline break-all"
        >
          {action.label}
        </a>
      )}
    </div>
  );
}
