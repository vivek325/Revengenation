import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms and Conditions – RevengeNation Stories",
  description: "Read the Terms and Conditions for using RevengeNation Stories.",
};

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Terms and Conditions</h1>
      <p className="text-sm text-slate-400 dark:text-[#475569] mb-10">Last Updated: April 12, 2026</p>

      <div className="space-y-8 text-sm leading-relaxed text-slate-600 dark:text-[#94A3B8]">

        <p>
          Please read these Terms and Conditions (&ldquo;Terms&rdquo;) carefully before using the website{" "}
          <a href="https://revengenationstories.com" className="text-[#E11D48] hover:underline">revengenationstories.com</a>{" "}
          (the &ldquo;Site&rdquo;) operated by RevengeNation Stories (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;).
        </p>
        <p>
          By accessing or using the Site, you agree to be bound by these Terms. If you disagree with any part of
          these Terms, you may not access the Site.
        </p>

        <Section title="1. Acceptance of Terms">
          <p>
            By accessing, browsing, or using this Site in any way, you acknowledge that you have read, understood,
            and agree to be bound by these Terms and our Privacy Policy. We reserve the right to update or modify
            these Terms at any time without prior notice. Your continued use of the Site following any changes
            constitutes your acceptance of the revised Terms. We encourage you to review these Terms periodically.
          </p>
        </Section>

        <Section title="2. Eligibility">
          <p>
            You must be at least 18 years of age to access or use this Site. By using the Site, you represent and
            warrant that you are at least 18 years old and have the legal capacity to enter into these Terms. If
            you are under 18, you may not use the Site.
          </p>
        </Section>

        <Section title="3. Description of Service">
          <p>
            RevengeNation Stories is an online platform that publishes educational content, personal stories,
            psychological analyses, practical guides, and community discussions related to infidelity,
            relationships, and personal recovery. The Site also features a YouTube channel and may offer
            interactive tools, email newsletters, and other features.
          </p>
          <p>
            The content on this Site is for informational and educational purposes only. It is not a substitute
            for professional advice from licensed therapists, attorneys, financial advisors, or other qualified
            professionals.
          </p>
        </Section>

        <Section title="4. User Accounts">
          <p>
            Certain features of the Site may require you to create an account. When creating an account, you
            agree to provide accurate, current, and complete information. You are responsible for maintaining the
            confidentiality of your account credentials and for all activities that occur under your account. You
            agree to notify us immediately of any unauthorized use of your account.
          </p>
          <p>
            We reserve the right to suspend or terminate your account at any time, with or without cause and with
            or without notice, if we believe you have violated these Terms or engaged in conduct that is harmful
            to other users, to us, or to the Site.
          </p>
        </Section>

        <Section title="5. User-Submitted Content">
          <p>
            Our Site allows users to submit stories, comments, and other content (&ldquo;User Content&rdquo;). By
            submitting User Content, you grant RevengeNation Stories a worldwide, non-exclusive, royalty-free,
            perpetual, irrevocable license to use, reproduce, modify, adapt, publish, translate, distribute,
            display, and create derivative works from your User Content in any media format and through any
            distribution channel.
          </p>
          <p>
            You represent and warrant that your User Content is original, that you have the right to submit it,
            and that it does not violate any third party&apos;s rights, including intellectual property rights,
            privacy rights, or any applicable law.
          </p>
          <p>
            We reserve the right to edit, modify, or remove any User Content at our sole discretion, including
            but not limited to content that we determine to be inappropriate, offensive, defamatory, or in
            violation of these Terms.
          </p>
          <p>
            All stories submitted to the Site may be edited for clarity, length, and style. Personally
            identifying information will be removed or changed to protect the privacy of all individuals
            mentioned in the story, unless the submitter provides explicit written consent otherwise.
          </p>
          <p>
            You acknowledge that submitting content to the Site does not guarantee that it will be published. We
            reserve the right to accept or reject any submission at our sole discretion.
          </p>
        </Section>

        <Section title="6. Prohibited Conduct">
          <p>When using the Site, you agree not to:</p>
          <ul>
            <li>Use the Site for any unlawful purpose or in violation of any applicable law or regulation</li>
            <li>Submit false, misleading, defamatory, or fraudulent content</li>
            <li>Impersonate any person or entity, or falsely represent your affiliation with any person or entity</li>
            <li>Harass, threaten, intimidate, or harm other users of the Site</li>
            <li>Post content that is hateful, discriminatory, violent, obscene, or sexually explicit</li>
            <li>Attempt to gain unauthorized access to the Site, other user accounts, or any systems or networks connected to the Site</li>
            <li>Use automated means (bots, scrapers, spiders) to access, collect data from, or interact with the Site without our prior written consent</li>
            <li>Interfere with or disrupt the operation of the Site or the servers or networks used to make the Site available</li>
            <li>Upload or transmit viruses, malware, or other malicious code</li>
            <li>Use the Site to send unsolicited commercial messages (spam)</li>
            <li>Attempt to reverse engineer, decompile, or disassemble any software or technology used on the Site</li>
            <li>Remove, alter, or obscure any copyright, trademark, or other proprietary notices on the Site</li>
          </ul>
        </Section>

        <Section title="7. Intellectual Property">
          <p>
            All content on this Site — including but not limited to text, articles, graphics, logos, icons,
            images, audio, video, software, and the overall design and layout of the Site — is the property of
            RevengeNation Stories or its content suppliers and is protected by Indian and international
            copyright, trademark, and other intellectual property laws.
          </p>
          <p>You may not reproduce, distribute, modify, create derivative works from, publicly display, publicly
            perform, republish, download, store, or transmit any content from the Site without our prior written
            consent, except as follows:</p>
          <ul>
            <li>You may temporarily store copies of materials in your computer&apos;s RAM incidental to your accessing and viewing those materials.</li>
            <li>You may store files that are automatically cached by your web browser for display enhancement purposes.</li>
            <li>You may print or download one copy of a reasonable number of pages of the Site for your own personal, non-commercial use and not for further reproduction, publication, or distribution.</li>
            <li>You may share links to the Site&apos;s content on social media platforms, provided that such sharing is not done in a way that suggests our endorsement of you or any third party.</li>
          </ul>
        </Section>

        <Section title="8. Third-Party Links and Content">
          <p>
            The Site may contain links to third-party websites, services, or resources that are not owned or
            controlled by RevengeNation Stories. We have no control over, and assume no responsibility for, the
            content, privacy policies, or practices of any third-party websites or services.
          </p>
          <p>
            You acknowledge and agree that we are not responsible or liable for any damage or loss caused or
            alleged to be caused by or in connection with the use of or reliance on any content, goods, or
            services available on or through any third-party websites or services.
          </p>
          <p>
            Our Site may contain affiliate links. When you click on an affiliate link and make a purchase or sign
            up for a service, we may receive a commission. This does not affect the price you pay or our editorial
            independence.
          </p>
        </Section>

        <Section title="9. Disclaimer of Warranties">
          <p className="uppercase text-xs tracking-wide">
            The site and all content, materials, information, and services provided on the site are provided on
            an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis without warranties of any kind, whether
            express, implied, or statutory. To the fullest extent permitted by applicable law, we disclaim all
            warranties, including but not limited to implied warranties of merchantability, fitness for a
            particular purpose, non-infringement, and accuracy.
          </p>
          <p className="uppercase text-xs tracking-wide mt-3">
            We do not warrant that the site will be uninterrupted, error-free, secure, or free of viruses or
            other harmful components. We do not warrant that the results obtained from the use of the site will
            be accurate or reliable.
          </p>
        </Section>

        <Section title="10. Limitation of Liability">
          <p className="uppercase text-xs tracking-wide">
            To the fullest extent permitted by applicable law, RevengeNation Stories, its owners, operators,
            affiliates, and their respective officers, directors, employees, and agents shall not be liable for
            any indirect, incidental, special, consequential, or punitive damages, including but not limited to
            loss of profits, data, use, goodwill, or other intangible losses, resulting from:
          </p>
          <ul className="uppercase text-xs tracking-wide">
            <li>Your access to or use of (or inability to access or use) the site</li>
            <li>Any conduct or content of any third party on the site</li>
            <li>Any content obtained from the site</li>
            <li>Unauthorized access, use, or alteration of your transmissions or content</li>
          </ul>
          <p className="uppercase text-xs tracking-wide mt-3">
            In no event shall our total liability to you for all claims related to the site exceed the amount
            you have paid to us in the twelve (12) months preceding the event giving rise to the liability, or
            one hundred Indian rupees (₹100), whichever is greater.
          </p>
        </Section>

        <Section title="11. Indemnification">
          <p>
            You agree to indemnify, defend, and hold harmless RevengeNation Stories and its owners, operators,
            affiliates, officers, directors, employees, and agents from and against any and all claims,
            liabilities, damages, losses, costs, and expenses (including reasonable attorneys&apos; fees) arising
            out of or in connection with your use of the Site, your violation of these Terms, your violation of
            any applicable law, or your violation of any rights of a third party.
          </p>
        </Section>

        <Section title="12. Governing Law and Jurisdiction">
          <p>
            These Terms shall be governed by and construed in accordance with the laws of India, without regard
            to its conflict of law provisions. Any disputes arising out of or relating to these Terms or your use
            of the Site shall be subject to the exclusive jurisdiction of the courts located in India.
          </p>
        </Section>

        <Section title="13. Severability">
          <p>
            If any provision of these Terms is found to be unenforceable or invalid by a court of competent
            jurisdiction, that provision shall be limited or eliminated to the minimum extent necessary so that
            these Terms shall otherwise remain in full force and effect.
          </p>
        </Section>

        <Section title="14. Entire Agreement">
          <p>
            These Terms, together with our Privacy Policy and Disclaimer, constitute the entire agreement
            between you and RevengeNation Stories regarding your use of the Site and supersede all prior and
            contemporaneous agreements, proposals, or representations, written or oral, concerning the subject
            matter of these Terms.
          </p>
        </Section>

        <Section title="15. Contact Us">
          <p>If you have any questions about these Terms, please contact us at:</p>
          <div className="mt-3 p-4 rounded-xl bg-slate-50 dark:bg-[#0A0C14] border border-slate-200 dark:border-[#1C2035]">
            <p className="font-bold text-slate-800 dark:text-white">RevengeNation Stories</p>
            <p>Email: <a href="mailto:contact@revengenationstories.com" className="text-[#E11D48] hover:underline">contact@revengenationstories.com</a></p>
            <p>Website: <a href="https://revengenationstories.com" className="text-[#E11D48] hover:underline">revengenationstories.com</a></p>
          </div>
        </Section>

      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-black text-slate-800 dark:text-white mb-3 pb-2 border-b border-slate-100 dark:border-[#1C2035]">
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
