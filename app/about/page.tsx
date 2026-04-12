import type { Metadata } from "next";
import Link from "next/link";
import { Flame, PlayCircle, BookOpen, Brain, FileText, Wrench, Heart, List } from "lucide-react";

export const metadata: Metadata = {
  title: "About – RevengeNation Stories",
  description: "RevengeNation Stories is a dedicated resource for men navigating infidelity, betrayal, and broken trust.",
};

const categories = [
  { icon: <BookOpen size={16} className="text-[#E11D48]" />, title: "Red Flag Guides", desc: "Evidence-based breakdowns of behavioral warning signs that indicate infidelity — before it's too late." },
  { icon: <Brain size={16} className="text-[#E11D48]" />, title: "Psychology & Mindset", desc: "Deep dives into the psychology of cheating — why it happens, how the cheating mind works, attachment theory." },
  { icon: <FileText size={16} className="text-[#E11D48]" />, title: "Cheating Stories", desc: "Real, anonymized stories submitted by readers and sourced from online communities. You're not alone." },
  { icon: <Wrench size={16} className="text-[#E11D48]" />, title: "How-To Guides", desc: "Step-by-step guides for gathering evidence, protecting assets, navigating divorce, and co-parenting." },
  { icon: <Heart size={16} className="text-[#E11D48]" />, title: "Relationship Advice", desc: "Honest guidance on the hardest decisions: staying or leaving, rebuilding trust, and dating again." },
  { icon: <List size={16} className="text-[#E11D48]" />, title: "Listicles & Roundups", desc: "Curated lists of the best books, resources, and tools for men dealing with infidelity — all in one place." },
];

const values = [
  { title: "Honesty over comfort.", desc: "We don't sugarcoat. We tell you what you need to hear — even when it's painful — because truth is the only foundation strong enough to build a real future on." },
  { title: "Education over entertainment.", desc: "Our YouTube channel entertains. This website educates. The stories draw you in, but the guides and psychology breakdowns are what actually help you navigate your situation." },
  { title: "Men's wellbeing matters.", desc: "We believe that men's emotional health and psychological recovery deserve the same level of resources that society provides to women. We are not anti-women — we are pro-men. There's a difference." },
  { title: "No judgment.", desc: "Whether you choose to stay or leave, whether you're suspicious or certain, whether you've been married 2 years or 20 — you're welcome here. Your pain is real. Your decision is yours." },
];

export default function AboutPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-10">

      {/* Hero */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E11D48] to-rose-700 flex items-center justify-center shadow-md shadow-rose-200 dark:shadow-rose-900/30">
          <Flame size={20} className="text-white" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">About RevengeNation Stories</h1>
      </div>

      <div className="space-y-10 text-sm leading-relaxed text-slate-600 dark:text-[#94A3B8]">

        {/* Who We Are */}
        <section>
          <h2 className="text-lg font-black text-slate-800 dark:text-white mb-3 pb-2 border-b border-slate-100 dark:border-[#1C2035]">Who We Are</h2>
          <div className="space-y-3">
            <p>
              RevengeNation Stories is a dedicated online resource for men navigating the painful reality of
              infidelity, betrayal, and broken trust in marriage.
            </p>
            <p>
              We started as a YouTube channel sharing real stories of cheating, betrayal, and karma — stories
              that resonated with millions of viewers because they were raw, honest, and deeply human. With over{" "}
              <span className="font-semibold text-slate-700 dark:text-[#CBD5E1]">1.3 million views</span> and a
              growing community of thousands, we realized something important: men going through infidelity
              don&apos;t just need stories. They need guidance, education, and a place where they don&apos;t
              feel alone.
            </p>
            <p className="font-semibold text-slate-700 dark:text-[#CBD5E1]">That realization became this website.</p>
          </div>
        </section>

        {/* What We Do */}
        <section>
          <h2 className="text-lg font-black text-slate-800 dark:text-white mb-3 pb-2 border-b border-slate-100 dark:border-[#1C2035]">What We Do</h2>
          <p className="mb-5">
            RevengeNation Stories is built around one mission: giving men the information, tools, and community
            they need to navigate infidelity — whether they&apos;re suspicious, have just discovered an affair,
            or are rebuilding their life after betrayal.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {categories.map((c) => (
              <div key={c.title} className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A0C14] border border-slate-200 dark:border-[#1C2035]">
                <div className="flex items-center gap-2 mb-1.5">
                  {c.icon}
                  <span className="text-sm font-bold text-slate-800 dark:text-white">{c.title}</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-[#64748B]">{c.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Why We Built This */}
        <section>
          <h2 className="text-lg font-black text-slate-800 dark:text-white mb-3 pb-2 border-b border-slate-100 dark:border-[#1C2035]">Why We Built This</h2>
          <div className="space-y-3">
            <p>Because when a man discovers his wife is cheating, the world offers him almost nothing.</p>
            <p>
              There are thousands of resources for women in crisis. Hotlines, shelters, support groups,
              therapists who specialize in women&apos;s issues, entire media ecosystems built around female
              empowerment after hardship.
            </p>
            <p>
              For men? There&apos;s Reddit threads at 3 AM. There&apos;s conflicting advice from friends
              who&apos;ve never been through it. There&apos;s a therapist who might not understand the specific
              psychology of male betrayal trauma. And there&apos;s a society that often tells him — directly or
              indirectly — that if she cheated, he must have done something to deserve it.
            </p>
            <p className="font-semibold text-slate-700 dark:text-[#CBD5E1]">That&apos;s not good enough.</p>
            <p>
              RevengeNation Stories exists because men deserve better resources. Men deserve honest,
              research-backed information. Men deserve practical guidance that helps them protect themselves
              legally and financially. Men deserve a community where their pain is acknowledged without judgment.
            </p>
            <p className="font-bold text-[#E11D48]">
              That&apos;s what we&apos;re building. Every article. Every story. Every guide. Every day.
            </p>
          </div>
        </section>

        {/* Our Values */}
        <section>
          <h2 className="text-lg font-black text-slate-800 dark:text-white mb-3 pb-2 border-b border-slate-100 dark:border-[#1C2035]">Our Values</h2>
          <div className="space-y-3">
            {values.map((v) => (
              <div key={v.title} className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A0C14] border border-slate-200 dark:border-[#1C2035]">
                <p className="font-bold text-slate-800 dark:text-white mb-1">{v.title}</p>
                <p className="text-xs text-slate-500 dark:text-[#64748B]">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* YouTube */}
        <section>
          <h2 className="text-lg font-black text-slate-800 dark:text-white mb-3 pb-2 border-b border-slate-100 dark:border-[#1C2035]">Our YouTube Channel</h2>
          <p className="mb-4">
            RevengeNation started on YouTube, and our channel remains a core part of what we do. We publish
            three videos per week — dramatic stories on Mondays, Reddit compilations on Wednesdays, and themed
            compilations on Saturdays. The YouTube channel entertains and builds community. The website educates
            and provides depth.
          </p>
          <a
            href="https://www.youtube.com/@RevengeNation1"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#E11D48] hover:bg-rose-700 text-white text-sm font-bold rounded-lg transition-all shadow-sm shadow-rose-200 dark:shadow-rose-900/20"
          >
            <PlayCircle size={16} />
            Subscribe on YouTube
          </a>
        </section>

        {/* Submit + Contact */}
        <section className="grid sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl bg-slate-50 dark:bg-[#0A0C14] border border-slate-200 dark:border-[#1C2035]">
            <h2 className="text-sm font-black text-slate-800 dark:text-white mb-2">Submit Your Story</h2>
            <p className="text-xs text-slate-500 dark:text-[#64748B] mb-3">
              Every story on this site comes from a real person. Your story might be the one that helps another
              man realize he&apos;s not alone.
            </p>
            <Link href="/submit" className="text-xs font-semibold text-[#E11D48] hover:underline">
              Submit Your Story →
            </Link>
          </div>
          <div className="p-5 rounded-xl bg-slate-50 dark:bg-[#0A0C14] border border-slate-200 dark:border-[#1C2035]">
            <h2 className="text-sm font-black text-slate-800 dark:text-white mb-2">Contact Us</h2>
            <p className="text-xs text-slate-500 dark:text-[#64748B] mb-3">
              Questions, feedback, or partnership inquiries? We&apos;re a small team and we read every message
              personally.
            </p>
            <Link href="/contact" className="text-xs font-semibold text-[#E11D48] hover:underline">
              Get in touch →
            </Link>
          </div>
        </section>

        <p className="text-center text-sm font-bold text-[#E11D48] pt-2">
          RevengeNation Stories — Because the truth is the beginning of everything.
        </p>

      </div>
    </main>
  );
}
