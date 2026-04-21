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

export type ScheduledProps = {
  tenantName: string;
  buildingName: string;
  moveInDate: string;
  batchCount: number;
  logoUrl?: string;
};

export function Scheduled(p: ScheduledProps) {
  return (
    <Html>
      <Head />
      <Preview>Your {p.buildingName} move-in totes are scheduled</Preview>
      <Body style={{ fontFamily: "system-ui, sans-serif", color: "#111" }}>
        <Container style={{ padding: 24, maxWidth: 560 }}>
          {p.logoUrl && <img src={p.logoUrl} alt={p.buildingName} height={48} />}
          <Heading>Welcome, {p.tenantName}.</Heading>
          <Section>
            <Text>
              On behalf of {p.buildingName}, we are pleased to confirm that {p.batchCount * 20}{" "}
              reusable moving totes have been scheduled for delivery in the days leading up to your
              move-in on <strong>{p.moveInDate}</strong>.
            </Text>
            <Text>
              The totes are provided as a complimentary courtesy to help make your move easier. You
              will receive a second email once the totes are delivered, with instructions for use
              and return.
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
