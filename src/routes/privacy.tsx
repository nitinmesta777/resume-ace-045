import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy | AI Resume Analyzer" },
      {
        name: "description",
        content:
          "How the AI Resume Analyzer handles your data: what is collected, how analyses are processed, cookies, retention and deletion.",
      },
      { property: "og:title", content: "Privacy Policy | AI Resume Analyzer" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrivacyPage,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="font-display text-lg font-semibold tracking-tight">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Effective date: 29 October 2026. This policy describes how the AI Resume Analyzer (a BCA
        mini project) handles your information.
      </p>

      <div className="mt-10 space-y-8">
        <Section title="What this product does">
          <p>
            The AI Resume Analyzer checks a resume you upload (PDF, DOCX or TXT) against a set of
            rule-based checks: contact details, resume sections, recognised skills, length, action
            words, and an optional job description comparison. It also offers accounts so you can
            save and revisit your analyses.
          </p>
        </Section>

        <Section title="Information we collect">
          <ul className="list-inside list-disc space-y-1.5">
            <li>
              <span className="font-medium text-foreground">Account information:</span> if you sign
              up, we collect the email address and password you register. The password is stored
              only as a secure hash by the authentication provider.
            </li>
            <li>
              <span className="font-medium text-foreground">Saved analyses:</span> if you choose
              "Save to my account", we store a summary of that analysis: the file name, the score,
              detected skills, missing keywords, suggestions, and the date.
            </li>
            <li>
              <span className="font-medium text-foreground">Resume files and text:</span> your
              resume file is parsed and analyzed entirely in your browser. The file itself and the
              extracted text are not uploaded to any server and are not stored after you close or
              reload the page.
            </li>
            <li>
              <span className="font-medium text-foreground">Technical data:</span> standard
              infrastructure logs from hosting and authentication services may include request
              metadata such as IP addresses. We do not use analytics or advertising trackers.
            </li>
          </ul>
        </Section>

        <Section title="How your information is used">
          <p>
            Your email address is used to create your account, send the confirmation and password
            reset emails you request, and show which account you are signed in with. Saved analyses
            are shown to you on the "My Analyses" page. We do not sell your data, and we do not use
            it for advertising or profiling.
          </p>
        </Section>

        <Section title="Cookies and local storage">
          <p>
            The app stores your sign-in session in your browser's local storage so you stay signed
            in between visits. It does not set advertising or tracking cookies. Clearing your
            browser storage signs you out.
          </p>
        </Section>

        <Section title="Third-party services">
          <ul className="list-inside list-disc space-y-1.5">
            <li>
              <span className="font-medium text-foreground">Hosting:</span> the site is hosted on
              Lovable's hosting infrastructure.
            </li>
            <li>
              <span className="font-medium text-foreground">Authentication and database:</span>{" "}
              accounts and saved analyses are handled by Lovable Cloud (a managed backend), which
              processes your email address and stores saved analyses.
            </li>
            <li>
              <span className="font-medium text-foreground">Email delivery:</span> confirmation and
              password reset emails are sent through Lovable's email service.
            </li>
          </ul>
        </Section>

        <Section title="Data retention and deletion">
          <p>
            You can delete any saved analysis yourself from the "My Analyses" page. If you want your
            account and all associated data deleted, contact us using the details below. Resume
            files and pasted resume text that were never saved are not retained anywhere.
          </p>
        </Section>

        <Section title="Your rights">
          <p>
            Depending on where you live, you may have rights to access, correct, export or delete
            your personal data, and to object to its processing. Because this is a student project,
            we handle requests manually by email using the contact below.
          </p>
        </Section>

        <Section title="Security">
          <p>
            Accounts are protected by the authentication provider's standard measures, including
            hashed passwords and row-level database policies so each user can only read and delete
            their own saved analyses. We have not completed a formal security audit, and we do not
            claim certifications or compliance measures beyond this.
          </p>
        </Section>

        <Section title="Changes to this policy">
          <p>
            If the product changes in ways that affect this policy, we will update this page and the
            effective date.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            For privacy questions or deletion requests, contact:{" "}
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
