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

export type DeliveredProps = {
  tenantName: string;
  buildingName: string;
  dropOffLocation: string;
  contactEmail: string;
  logoUrl?: string;
};

export function Delivered(p: DeliveredProps) {
  return (
    <Html>
      <Head />
      <Preview>Your {p.buildingName} totes have been delivered</Preview>
      <Body style={{ fontFamily: "system-ui, sans-serif", color: "#111" }}>
        <Container style={{ padding: 24, maxWidth: 560 }}>
          {p.logoUrl && <img src={p.logoUrl} alt={p.buildingName} height={48} />}
          <Heading>Your totes have arrived.</Heading>
          <Section>
            <Text>Dear {p.tenantName},</Text>
            <Text>
              Your reusable moving totes from {p.buildingName} have been delivered. Please use them
              to pack your belongings as you prepare for your move.
            </Text>
            <Text>
              After you are settled, return the empty totes to: <strong>{p.dropOffLocation}</strong>
              . You may reach us at <a href={`mailto:${p.contactEmail}`}>{p.contactEmail}</a> with
              any questions.
            </Text>
            <Text>
              You will receive one additional reminder approximately 48 hours after your move-in
              date with the return details.
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
