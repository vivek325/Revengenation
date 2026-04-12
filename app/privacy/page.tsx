import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy – RevengeNation Stories",
  description: "Learn how RevengeNation Stories collects, uses, and protects your information.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Privacy Policy</h1>
      <p className="text-sm text-slate-400 dark:text-[#475569] mb-10">Last Updated: April 12, 2026</p>

      <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed text-slate-600 dark:text-[#94A3B8]">

        <p>
          RevengeNation Stories (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) operates the website{" "}
          <a href="https://revengenationstories.com" className="text-[#E11D48] hover:underline">revengenationstories.com</a>{" "}
          (the &ldquo;Site&rdquo;). This Privacy Policy explains how we collect, use, disclose, and safeguard your
          information when you visit our Site. Please read this Privacy Policy carefully. By accessing or using the
          Site, you agree to the terms of this Privacy Policy.
        </p>
        <p>If you do not agree with the terms of this Privacy Policy, please do not access the Site.</p>

        {/* Section */}
        <Section title="Information We Collect">
          <SubSection title="Information You Provide to Us">
            <p>We may collect information that you voluntarily provide when you:</p>
            <ul>
              <li>Create an account or register on our Site</li>
              <li>Submit a story or content through our submission forms</li>
              <li>Subscribe to our email newsletter</li>
              <li>Leave a comment on a blog post</li>
              <li>Contact us through our contact form or email</li>
              <li>Participate in surveys, polls, or interactive features on the Site</li>
            </ul>
            <p>
              This information may include your name, email address, username, and any other information you choose
              to provide. When you submit a story, we collect the story content along with any details you provide.
              All stories may be published anonymously unless you choose otherwise.
            </p>
          </SubSection>

          <SubSection title="Information Collected Automatically">
            <p>When you visit our Site, certain information is collected automatically, including:</p>
            <ul>
              <li><strong>Log Data:</strong> Your browser type, operating system, referring URLs, pages viewed, time spent on pages, and access times.</li>
              <li><strong>Device Information:</strong> Information about the device you use to access our Site, including device type, screen resolution, and unique device identifiers.</li>
              <li><strong>Cookies and Similar Technologies:</strong> We use cookies, web beacons, and similar tracking technologies to collect information about your browsing activity. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, some portions of the Site may not function properly.</li>
              <li><strong>Location Information:</strong> We may collect general location data based on your IP address. We do not collect precise geolocation data.</li>
            </ul>
          </SubSection>

          <SubSection title="Information from Third Parties">
            <p>We may receive information about you from third-party services, including:</p>
            <ul>
              <li><strong>Analytics providers</strong> such as Google Analytics, which help us understand Site traffic and usage patterns.</li>
              <li><strong>Advertising partners</strong> who may provide information about your interactions with advertisements displayed on our Site.</li>
              <li><strong>Social media platforms</strong> if you interact with our content on those platforms or use social media features on our Site.</li>
            </ul>
          </SubSection>
        </Section>

        <Section title="How We Use Your Information">
          <p>We use the information we collect for the following purposes:</p>
          <ul>
            <li>To operate, maintain, and improve our Site and its features</li>
            <li>To provide, personalize, and enhance your experience on the Site</li>
            <li>To communicate with you, including responding to your inquiries and sending newsletters or updates you have opted into</li>
            <li>To publish stories and content submitted by users (with personally identifying details removed or anonymized unless you consent otherwise)</li>
            <li>To display advertisements and measure their effectiveness</li>
            <li>To analyze usage trends, monitor Site performance, and gather demographic information about our user base</li>
            <li>To detect, prevent, and address technical issues, fraud, or security concerns</li>
            <li>To comply with legal obligations and enforce our Terms and Conditions</li>
          </ul>
        </Section>

        <Section title="Advertising and Third-Party Services">
          <p>
            We may display advertisements on our Site provided by third-party advertising networks, including Google
            AdSense and other advertising partners. These third-party advertisers may use cookies, web beacons, and
            similar technologies to collect information about your visits to our Site and other websites in order to
            provide relevant advertisements to you.
          </p>
          <p>
            <strong>Google AdSense:</strong> We use Google AdSense to display advertisements. Google may use cookies
            to serve ads based on your prior visits to our Site and other websites. You can opt out of personalized
            advertising by visiting{" "}
            <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="text-[#E11D48] hover:underline">
              Google&apos;s Ads Settings
            </a>
            . For more information about how Google uses data when you visit partner sites, visit{" "}
            <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer" className="text-[#E11D48] hover:underline">
              Google&apos;s Privacy &amp; Terms
            </a>
            .
          </p>
          <p>
            <strong>Affiliate Links:</strong> Some content on our Site may contain affiliate links. When you click on
            an affiliate link and make a purchase or sign up for a service, we may receive a commission at no
            additional cost to you. Our affiliate partnerships include but are not limited to therapy platforms, book
            retailers, and other relevant services. The presence of affiliate links does not influence our editorial
            content or recommendations.
          </p>
        </Section>

        <Section title="How We Share Your Information">
          <p>We do not sell your personal information to third parties. We may share your information in the following circumstances:</p>
          <ul>
            <li><strong>Service Providers:</strong> We may share your information with third-party service providers who perform services on our behalf, such as website hosting, email delivery, analytics, and advertising. These service providers are contractually obligated to use your information only for the purposes of providing services to us.</li>
            <li><strong>Legal Requirements:</strong> We may disclose your information if required to do so by law or in response to valid legal requests, such as a court order or government investigation.</li>
            <li><strong>Business Transfers:</strong> If we are involved in a merger, acquisition, or sale of all or a portion of our assets, your information may be transferred as part of that transaction.</li>
            <li><strong>With Your Consent:</strong> We may share your information with third parties when you have given us your explicit consent to do so.</li>
            <li><strong>Anonymized and Aggregated Data:</strong> We may share anonymized or aggregated information that cannot reasonably be used to identify you with third parties for analytics, advertising, research, or other purposes.</li>
          </ul>
        </Section>

        <Section title="Data Retention">
          <p>
            We retain your personal information for as long as necessary to fulfill the purposes described in this
            Privacy Policy, unless a longer retention period is required or permitted by law. When we no longer need
            to retain your information, we will securely delete or anonymize it.
          </p>
          <p>
            User account information is retained for the duration of your account and for a reasonable period
            thereafter. Story submissions may be retained indefinitely as part of our published content. You may
            request deletion of your information by contacting us using the details provided below.
          </p>
        </Section>

        <Section title="Data Security">
          <p>
            We implement commercially reasonable security measures to protect your personal information from
            unauthorized access, disclosure, alteration, or destruction. These measures include encryption, secure
            hosting, access controls, and regular security assessments. However, no method of transmission over the
            internet or method of electronic storage is completely secure. While we strive to protect your
            information, we cannot guarantee its absolute security.
          </p>
        </Section>

        <Section title="Your Rights and Choices">
          <p>Depending on your location, you may have certain rights regarding your personal information:</p>
          <ul>
            <li><strong>Access:</strong> You may request a copy of the personal information we hold about you.</li>
            <li><strong>Correction:</strong> You may request that we correct any inaccurate or incomplete personal information.</li>
            <li><strong>Deletion:</strong> You may request that we delete your personal information, subject to certain legal exceptions.</li>
            <li><strong>Opt-Out of Marketing:</strong> You may opt out of receiving marketing emails from us by clicking the &ldquo;unsubscribe&rdquo; link in any marketing email we send.</li>
            <li><strong>Cookie Preferences:</strong> You can control cookies through your browser settings. Most browsers allow you to refuse cookies, delete existing cookies, or alert you when a cookie is being set.</li>
          </ul>
          <p>
            To exercise any of these rights, please contact us using the contact information provided below. We will
            respond to your request within a reasonable timeframe and in accordance with applicable law.
          </p>
        </Section>

        <Section title="Children's Privacy">
          <p>
            Our Site is not intended for individuals under the age of 18. We do not knowingly collect personal
            information from children under 18. If we become aware that a child under 18 has provided us with
            personal information, we will take steps to delete such information promptly. If you believe that a child
            under 18 has provided us with personal information, please contact us immediately.
          </p>
        </Section>

        <Section title="International Users">
          <p>
            Our Site is operated from India and is intended primarily for users in India, the United States, the
            United Kingdom, Canada, and Australia. If you are accessing our Site from outside India, please be aware
            that your information may be transferred to, stored, and processed in India or other countries where our
            service providers operate. By using our Site, you consent to the transfer of your information to
            countries that may have different data protection laws than your country of residence.
          </p>
        </Section>

        <Section title="Changes to This Privacy Policy">
          <p>
            We may update this Privacy Policy from time to time to reflect changes in our practices, technology, or
            legal requirements. When we make changes, we will update the &ldquo;Last Updated&rdquo; date at the top
            of this page. We encourage you to review this Privacy Policy periodically to stay informed about how we
            are protecting your information. Your continued use of the Site after any changes to this Privacy Policy
            constitutes your acceptance of the updated policy.
          </p>
        </Section>

        <Section title="Contact Us">
          <p>
            If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices,
            please contact us at:
          </p>
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

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <h3 className="text-sm font-bold text-slate-700 dark:text-[#CBD5E1] mb-2">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
