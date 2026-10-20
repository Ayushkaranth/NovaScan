import type { Metadata } from "next";
import Link from "next/link";
import { Activity, ArrowLeft, Bot, BriefcaseBusiness, LockKeyhole, PlugZap, Users } from "lucide-react";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Privacy Policy | NovaScan",
  description: "Learn what NovaScan does, what information it handles, and how that information is used.",
};

const sections = [
  { id: "overview", label: "What NovaScan does" },
  { id: "information", label: "Information we handle" },
  { id: "use", label: "How information is used" },
  { id: "integrations", label: "Connected services" },
  { id: "ai", label: "AI processing" },
  { id: "storage", label: "Storage and security" },
  { id: "retention", label: "Retention and deletion" },
  { id: "choices", label: "Your choices" },
  { id: "changes", label: "Policy updates" },
  { id: "contact", label: "Contact" },
];

function PolicySection({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28 border-b border-border/70 py-9 last:border-b-0">
      <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{title}</h2>
      <div className="mt-4 space-y-4 text-[15px] leading-7 text-muted-foreground">{children}</div>
    </section>
  );
}

const productAreas = [
  {
    icon: <BriefcaseBusiness className="h-5 w-5 text-primary" />,
    title: "Projects and teams",
    text: "Organization workspaces, projects, members, roles, and project assignments keep engineering work organized.",
  },
  {
    icon: <PlugZap className="h-5 w-5 text-primary" />,
    title: "Connected tools",
    text: "Admins can authorize supported GitHub, Slack, and Jira connections to bring project context into NovaScan.",
  },
  {
    icon: <Activity className="h-5 w-5 text-primary" />,
    title: "Risk and delivery insights",
    text: "Incoming project events can be analyzed and shown as risk summaries, recommendations, and dashboard activity.",
  },
  {
    icon: <Users className="h-5 w-5 text-primary" />,
    title: "Team workflows",
    text: "Project tools include team coordination features such as assignments, standups, and notifications where configured.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />

      <div className="mx-auto max-w-7xl px-5 pb-20 pt-28 sm:px-8 lg:px-10">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to NovaScan
        </Link>

        <header className="relative overflow-hidden rounded-[2rem] border border-border bg-card px-7 py-10 shadow-sm sm:px-12 sm:py-14">
          <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              <LockKeyhole className="h-3.5 w-3.5" /> Privacy and product overview
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Privacy at NovaScan</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              NovaScan helps teams connect engineering work to the context around it. This page explains the main parts of the product and how information is handled when you use it.
            </p>
            <p className="mt-5 text-sm text-muted-foreground">Effective date: October 20, 2026</p>
          </div>
        </header>

        <div className="mt-8 grid gap-8 lg:grid-cols-[250px_minmax(0,1fr)] lg:items-start">
          <aside className="rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-24">
            <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">On this page</p>
            <nav aria-label="Privacy policy sections" className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-1">
              {sections.map((section) => (
                <a key={section.id} href={`#${section.id}`} className="rounded-lg px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                  {section.label}
                </a>
              ))}
            </nav>
          </aside>

          <article className="min-w-0 rounded-2xl border border-border bg-card px-6 sm:px-10">
            <PolicySection id="overview" title="What NovaScan does">
              <p>NovaScan is an engineering intelligence and project coordination application. Depending on the features enabled by your organization, it can organize projects and teams, connect GitHub, Slack, and Jira, analyze project events for potential risks, and present summaries and recommendations in a dashboard.</p>
              <div className="grid gap-3 pt-2 sm:grid-cols-2">
                {productAreas.map((area) => (
                  <div key={area.title} className="rounded-xl border border-border bg-muted/20 p-4">
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">{area.icon}</div>
                    <h3 className="font-semibold text-foreground">{area.title}</h3>
                    <p className="mt-1 text-sm leading-6">{area.text}</p>
                  </div>
                ))}
              </div>
            </PolicySection>

            <PolicySection id="information" title="Information we handle">
              <p>Information depends on how your organization configures and uses NovaScan. It may include:</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>Account and organization details, such as name, email address, role, and organization membership.</li>
                <li>Project details, team assignments, standup entries, and settings that users submit.</li>
                <li>Integration account identifiers, selected workspace or site details, granted scopes, and OAuth tokens needed to provide the connection.</li>
                <li>Project events and related context from connected services, such as pull request metadata or diffs, Jira issue details, and Slack messages made available to the integration.</li>
                <li>Risk results, recommendations, and operational information needed to run and secure the service.</li>
              </ul>
            </PolicySection>

            <PolicySection id="use" title="How information is used">
              <p>NovaScan uses this information to authenticate users, provide organization and project features, retrieve authorized context from connected services, analyze project events, deliver requested notifications, and maintain the application.</p>
              <p>We do not describe connected-service access as unrestricted: each connection is limited by the scopes the user approves and by that user’s permissions in the provider service.</p>
            </PolicySection>

            <PolicySection id="integrations" title="Connected services">
              <p>An organization administrator or other authorized user starts an OAuth connection and approves the requested permissions with the provider. NovaScan stores the resulting tokens for the organization so its enabled project features can use the connection.</p>
              <p>GitHub, Slack, Atlassian, and any AI provider process data under their own terms and privacy practices. Disconnecting an integration in NovaScan stops future use of that connection by NovaScan; it does not necessarily revoke access at the provider unless the provider revocation flow is also completed.</p>
            </PolicySection>

            <PolicySection id="ai" title="AI processing">
              <div className="flex gap-3 rounded-xl border border-primary/15 bg-primary/5 p-4">
                <Bot className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <p>When risk analysis runs, relevant event context may be sent to the AI service configured for the NovaScan deployment. The current risk-analysis path uses Google Gemini when configured. This context can include event summaries and content from connected tools. Do not connect a source or submit information that your organization is not permitted to process this way.</p>
              </div>
              <p>Your organization should review the AI provider’s terms and data practices and configure its deployment accordingly. AI-generated risk scores and recommendations are assistive outputs and should be reviewed by people before important decisions are made.</p>
            </PolicySection>

            <PolicySection id="storage" title="Storage and security">
              <p>NovaScan stores application information in the database configured for the deployment. OAuth access and refresh tokens are encrypted by the application before they are saved. The encryption key and database hosting are controlled by the deployment operator.</p>
              <p>Authentication tokens are stored in the browser’s local storage by the current web application. No online service can guarantee that information is completely secure; organizations should restrict account access and protect their deployment credentials.</p>
            </PolicySection>

            <PolicySection id="retention" title="Retention and deletion">
              <p>Information is retained in the configured deployment while it is needed to provide the application and its project history. Retention and backup schedules depend on the deployment. An organization administrator can request account, project, or integration data removal from the NovaScan service operator; connected provider access should also be revoked from that provider.</p>
            </PolicySection>

            <PolicySection id="choices" title="Your choices">
              <ul className="list-disc space-y-2 pl-5">
                <li>Organization administrators choose which integrations to connect and can disconnect them in NovaScan.</li>
                <li>Users should provide only project information their organization has authorized for use.</li>
                <li>You can ask your organization administrator to correct or remove information associated with your account or projects.</li>
                <li>Provider-side permissions and access can also be reviewed or revoked from GitHub, Slack, or Atlassian account settings.</li>
              </ul>
            </PolicySection>

            <PolicySection id="changes" title="Policy updates">
              <p>This policy may be updated as NovaScan’s features, providers, or operating practices change. The effective date at the top of this page indicates when the current version was published. Material changes should be communicated through the application or another channel used by your organization.</p>
            </PolicySection>

            <PolicySection id="contact" title="Contact">
              <p>For privacy questions, data requests, or concerns, contact your organization administrator or the NovaScan service operator who provided your account. If your organization hosts NovaScan itself, contact that organization’s application administrator.</p>
            </PolicySection>
          </article>
        </div>

        <footer className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 text-sm text-muted-foreground sm:flex-row">
          <Link href="/" className="inline-flex items-center gap-2 transition-colors hover:text-foreground">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary"><Activity className="h-3.5 w-3.5 text-primary-foreground" /></span>
            NovaScan
          </Link>
          <span>© 2026 NovaScan. All rights reserved.</span>
        </footer>
      </div>
    </main>
  );
}
