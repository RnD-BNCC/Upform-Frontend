import type { ReactNode } from "react";
import LegalPageShell from "./LegalPageShell";

function Section({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <section>
      <h2 className="text-base font-black text-gray-900">{title}</h2>
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  );
}

export default function TermsOfServicePage() {
  return (
    <LegalPageShell eyebrow="Terms" title="Terms of Service">
      <Section title="Acceptance">
        <p>
          By using UpForm, you agree to these Terms of Service. If you do not
          agree, please do not use the service.
        </p>
      </Section>

      <Section title="Service Description">
        <p>
          UpForm provides tools to create forms, collect responses, manage
          uploaded files, share galleries, and optionally sync selected gallery
          files to a connected Google Drive account.
        </p>
      </Section>

      <Section title="Accounts and Access">
        <p>
          You are responsible for the Google account you use to access UpForm
          and for keeping your account secure. Some areas may be restricted to
          authorized users or invited email addresses.
        </p>
      </Section>

      <Section title="User Content">
        <p>
          You retain responsibility for forms, responses, files, images, and
          other content uploaded or managed through UpForm. You must have the
          rights and permission needed to collect, upload, share, or sync that
          content.
        </p>
      </Section>

      <Section title="Google Drive Integration">
        <p>
          If you connect Google Drive, you authorize UpForm to create folders,
          upload submitted gallery files, and manage files created by UpForm in
          the selected Drive account. You can revoke access from your Google
          Account settings at any time.
        </p>
      </Section>

      <Section title="Acceptable Use">
        <p>
          You may not use UpForm to violate laws, infringe rights, distribute
          harmful content, attempt unauthorized access, or disrupt the service.
        </p>
      </Section>

      <Section title="Availability and Changes">
        <p>
          We may update, suspend, or discontinue parts of the service as needed.
          We may also update these terms when the service changes.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          For questions about these terms, contact us at contact@upform.id.
        </p>
      </Section>
    </LegalPageShell>
  );
}
