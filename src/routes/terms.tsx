import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms and Conditions | AI Resume Analyzer" },
      {
        name: "description",
        content:
          "Terms and Conditions for using the AI Resume Analyzer: acceptable use, accounts, limitations and disclaimers.",
      },
      { property: "og:title", content: "Terms and Conditions | AI Resume Analyzer" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TermsPage,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="font-display text-lg font-semibold tracking-tight">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Terms and Conditions</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Effective date: 31 October 2026. These terms govern your use of the AI Resume Analyzer (a
        BCA mini project).
      </p>

      <div className="mt-10 space-y-8">
        <Section title="Acceptance of terms">
          <p>
            By using this website or creating an account, you agree to these terms. If you do not
            agree, please do not use the site.
          </p>
        </Section>

        <Section title="What the product does and does not do">
          <p>
            The analyzer runs automated, rule-based checks on the resume text you provide and
            returns a score, detected skills, missing sections, an optional job description match
            and suggestions. The output is general guidance produced by fixed rules, not professional
            career advice, and no hiring or interview outcome is promised. How you use the results is
            up to you.
          </p>
        </Section>

        <Section title="Acceptable use">
          <ul className="list-inside list-disc space-y-1.5">
            <li>Use the site only for its intended purpose: analyzing resumes you have the right to use.</li>
            <li>Do not attempt to break, overload, scrape at scale, or gain unauthorised access to the site or its backend.</li>
            <li>Do not use the accounts or data of other users.</li>
          </ul>
        </Section>

        <Section title="Accounts">
          <ul className="list-inside list-disc space-y-1.5">
            <li>You must provide a valid email address you control when signing up.</li>
            <li>You are responsible for keeping your password confidential and for activity in your account.</li>
            <li>Saved analyses are private to your account and can be deleted by you at any time from the "My Analyses" page.</li>
            <li>Notify us if you believe your account has been compromised.</li>
          </ul>
        </Section>

        <Section title="Your content">
          <p>
            Your resume content remains yours. By using the analyzer you grant no rights over your
            resume beyond what is technically needed to process it in your browser. Saved analyses
            are stored for your personal use only.
          </p>
        </Section>

        <Section title="Availability and changes">
          <p>
            This is a student project provided free of charge. Features may change or be
            discontinued at any time, including account and history features, without prior notice.
          </p>
        </Section>

        <Section title="Disclaimer and limitation of liability">
          <p>
            The site is provided "as is" and "as available" without warranties of any kind, express
            or implied, including accuracy of the analysis or fitness for a particular purpose. To
            the extent permitted by applicable law, the project author is not liable for any loss or
            damage arising from use of the site or reliance on its output.
          </p>
        </Section>

        <Section title="Termination and suspension">
          <p>
            Accounts may be suspended or removed if these terms are violated or if the project is
            discontinued. You can stop using the site at any time and request deletion of your
            account data using the contact below.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions about these terms:{" "}
            <span className="font-medium text-foreground">
              [contact email to be added by the project owner before publishing]
            </span>
            .
          </p>
        </Section>
      </div>
    </main>
  );
}
