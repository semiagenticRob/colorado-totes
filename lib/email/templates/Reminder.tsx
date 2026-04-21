import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export type ReminderProps = {
  tenantName: string;
  buildingName: string;
  dropOffLocation: string;
  contactEmail: string;
  logoUrl?: string;
};

export function Reminder(p: ReminderProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to {p.buildingName} — returning your totes</Preview>
      <Body style={{ fontFamily: "system-ui, sans-serif", color: "#111" }}>
        <Container style={{ padding: 24, maxWidth: 560 }}>
          {p.logoUrl && <img src={p.logoUrl} alt={p.buildingName} height={48} />}
          <Heading>Welcome home.</Heading>
          <Section>
            <Text>Dear {p.tenantName},</Text>
            <Text>
              We hope your move to {p.buildingName} has gone smoothly. When you are finished
              unpacking, please return your moving totes to: <strong>{p.dropOffLocation}</strong>.
            </Text>
            <Text>
              If you have any questions, please contact{" "}
              <a href={`mailto:${p.contactEmail}`}>{p.contactEmail}</a>.
            </Text>
            <Text>
              Sincerely,
              <br />
              The {p.buildingName} team
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
