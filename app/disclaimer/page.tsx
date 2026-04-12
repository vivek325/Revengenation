import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Disclaimer – RevengeNation Stories",
  description: "Read the disclaimer for RevengeNation Stories regarding the nature of content published on this site.",
};

export default function DisclaimerPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Disclaimer</h1>
      <p className="text-sm text-slate-400 dark:text-[#475569] mb-10">Last Updated: April 12, 2026</p>

      <div className="space-y-8 text-sm leading-relaxed text-slate-600 dark:text-[#94A3B8]">

        <p>
          The information provided on{" "}
          <a href="https://revengenationstories.com" className="text-[#E11D48] hover:underline">revengenationstories.com</a>{" "}
          (the &ldquo;Site&rdquo;) by RevengeNation Stories (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) is for
          general informational and educational purposes only. Please read this Disclaimer carefully before using the Site.
        </p>

        <Section title="Not Professional Advice">
          <p>
            The content published on this Site — including articles, guides, stories, psychological analyses, practical
            recommendations, and interactive tools — is created for educational and informational purposes. It is not
            intended to be, and should not be construed as, professional advice of any kind.
          </p>
          <p className="font-semibold text-slate-700 dark:text-[#CBD5E1] mt-3">This Site does not provide:</p>
          <ul>
            <li>
              <strong>Legal advice.</strong> Our articles may discuss legal topics such as divorce, custody, asset
              protection, and evidence gathering. This information is general in nature and may not apply to your
              specific situation or jurisdiction. Laws vary significantly by state, province, and country. Always
              consult a licensed family law attorney in your jurisdiction before making any legal decisions or taking
              any legal action.
            </li>
            <li>
              <strong>Medical or mental health advice.</strong> Our content may discuss psychological concepts, trauma
              responses, therapy approaches, and mental health topics. This information is educational and does not
              constitute a diagnosis, treatment plan, or therapeutic relationship. If you are experiencing mental
              health distress, please consult a licensed mental health professional. If you are in crisis, contact
              your local emergency services or a crisis helpline immediately.
            </li>
            <li>
              <strong>Financial advice.</strong> Our articles may discuss financial protection strategies, asset
              management during divorce, and monetization topics. This information is general in nature and should
              not be relied upon as financial planning or investment advice. Consult a qualified financial advisor
              for guidance specific to your situation.
            </li>
            <li>
              <strong>Relationship or counseling advice.</strong> While our content aims to help men navigate
              difficult relationship situations, it is not a substitute for professional couples counseling,
              individual therapy, or mediation. Every relationship is unique, and decisions about staying in or
              leaving a relationship should be made with the guidance of qualified professionals who understand
              your specific circumstances.
            </li>
          </ul>
        </Section>

        <Section title="Accuracy of Information">
          <p>
            We make every effort to ensure that the information on this Site is accurate, current, and reliable.
            However, we make no representations or warranties of any kind, express or implied, about the
            completeness, accuracy, reliability, suitability, or availability of the information, products,
            services, or related content contained on the Site for any purpose.
          </p>
          <p>
            Information on this Site may contain errors, inaccuracies, or omissions. We reserve the right to
            correct any errors or omissions and to change or update information at any time without prior notice.
          </p>
          <p>
            Any reliance you place on information provided on this Site is strictly at your own risk. We shall
            not be liable for any loss or damage, including without limitation, indirect or consequential loss or
            damage, arising from the use of or reliance on information provided on this Site.
          </p>
        </Section>

        <Section title="Stories and User-Submitted Content">
          <p>
            The stories published on this Site are submitted by readers or sourced from publicly available online
            communities such as Reddit. All stories are edited for clarity and anonymized to protect the identities
            of the individuals involved. Names, locations, and identifying details are changed in all published
            stories.
          </p>
          <p>
            These stories represent the personal experiences and perspectives of the individuals who shared them.
            They do not necessarily reflect the views, opinions, or endorsement of RevengeNation Stories. We
            cannot independently verify the accuracy or truthfulness of every detail in user-submitted stories.
          </p>
          <p>
            Stories are published for educational and illustrative purposes — to help readers recognize patterns,
            understand common experiences, and feel less alone in their situations. They should not be interpreted
            as evidence, legal testimony, or factual documentation of specific events.
          </p>
        </Section>

        <Section title="Affiliate Disclosure">
          <p>
            Some links on this Site are affiliate links. This means that if you click on a link and make a
            purchase or sign up for a service, we may receive a small commission at no additional cost to you.
          </p>
          <p>Our affiliate partnerships include, but are not limited to:</p>
          <ul>
            <li>Online therapy platforms (such as BetterHelp)</li>
            <li>Book retailers (such as Amazon)</li>
            <li>Other products and services relevant to our audience</li>
          </ul>
          <p>
            The presence of affiliate links does not influence our editorial content, recommendations, or opinions.
            We only recommend products and services that we genuinely believe may be helpful to our audience.
            However, we encourage you to conduct your own research before purchasing any product or service
            recommended on this Site.
          </p>
        </Section>

        <Section title="External Links">
          <p>
            This Site may contain links to external websites that are not provided or maintained by or in any way
            affiliated with RevengeNation Stories. We do not guarantee the accuracy, relevance, timeliness, or
            completeness of any information on these external websites.
          </p>
          <p>
            The inclusion of any links does not necessarily imply a recommendation or endorsement of the views
            expressed within them. We have no control over the content, privacy practices, or availability of
            linked websites and accept no responsibility for them.
          </p>
        </Section>

        <Section title="No Guarantees">
          <p>
            We do not guarantee any specific outcomes or results from following the advice, strategies, or
            recommendations provided on this Site. Every individual&apos;s situation is unique, and results will
            vary based on numerous factors including but not limited to personal circumstances, jurisdiction,
            relationship dynamics, and professional guidance received.
          </p>
          <p>
            The psychological frameworks, behavioral analyses, and pattern descriptions provided on this Site are
            based on general research and clinical literature. They are presented as educational information to
            help readers understand common dynamics associated with infidelity. They should not be used to
            diagnose, accuse, or make definitive conclusions about any specific individual or relationship.
          </p>
        </Section>

        <Section title="Interactive Tools">
          <p>
            Any interactive tools, assessments, quizzes, or calculators provided on this Site are for educational
            and entertainment purposes only. The results of these tools are not clinical diagnoses, legal opinions,
            or professional assessments. They are designed to help users think about their situations and should
            not be used as the sole basis for making important life decisions.
          </p>
        </Section>

        <Section title="Limitation of Liability">
          <p>
            To the fullest extent permitted by applicable law, RevengeNation Stories and its owners, operators,
            and affiliates shall not be liable for any damages whatsoever, including but not limited to direct,
            indirect, incidental, special, consequential, or punitive damages, arising out of or in connection
            with your use of, or inability to use, this Site or any content provided on the Site.
          </p>
        </Section>

        <Section title="Changes to This Disclaimer">
          <p>
            We reserve the right to update or modify this Disclaimer at any time. When we make changes, we will
            update the &ldquo;Last Updated&rdquo; date at the top of this page. Your continued use of the Site
            after any changes to this Disclaimer constitutes your acceptance of the updated Disclaimer.
          </p>
        </Section>

        <Section title="Contact Us">
          <p>If you have any questions about this Disclaimer, please contact us at:</p>
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
