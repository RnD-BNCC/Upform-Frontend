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

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell eyebrow="Privacy" title="Privacy Policy">
      <Section title="Overview">
        <p>
          UpForm is a form, response, and gallery management tool. This policy
          explains what information we collect, how we use it, and how Google
          Drive access is handled.
        </p>
      </Section>

      <Section title="Information We Collect">
        <p>
          We may collect account information such as name, email address, and
          profile image when you sign in with Google. We also process form
          content, responses, uploaded files, gallery sharing settings, and
          basic activity needed to operate the service.
        </p>
      </Section>

      <Section title="Google Drive Access">
        <p>
          When you choose to connect Google Drive, UpForm requests permission to
          create and manage files and folders that UpForm creates or opens with
          your selected Google account. We use this access to create gallery
          folders, upload submitted files, and keep shared gallery files in
          sync. We do not use this permission to access unrelated Drive files.
        </p>
      </Section>

      <Section title="How We Use Information">
        <p>
          We use information to provide authentication, build forms, store and
          show responses, manage galleries, sync selected files to Google Drive,
          improve reliability, and protect the service from misuse.
        </p>
      </Section>

      <Section title="Sharing and Storage">
        <p>
          We do not sell personal information. Information may be processed by
          service providers used to run UpForm, including hosting, database,
          file storage, email delivery, Google authentication, and Google Drive.
        </p>
      </Section>

      <Section title="Data Retention and Deletion">
        <p>
          We keep information for as long as needed to provide the service or
          meet operational requirements. Users may request deletion of their
          account data or connected gallery data by contacting us.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          For privacy questions or data requests, contact us at
          contact@upform.id.
        </p>
      </Section>
    </LegalPageShell>
  );
}
