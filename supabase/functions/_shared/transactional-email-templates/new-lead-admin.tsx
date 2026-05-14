import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface NewLeadAdminProps {
  name?: string
  email?: string
  phone?: string
}

const NewLeadAdminEmail = ({
  name = '',
  email = '',
  phone = '',
}: NewLeadAdminProps) => (
  <Html lang="it" dir="ltr">
    <Head />
    <Preview>Nuovo lead (test non ancora completato): {name}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Nuovo lead — test non ancora completato</Heading>
        <Text style={text}>
          Un utente ha compilato il form ma non ha (ancora) completato il test. Dati di contatto:
        </Text>
        <Section style={card}>
          <Text style={row}><strong>Nome:</strong> {name}</Text>
          <Text style={row}><strong>Email:</strong> {email}</Text>
          <Text style={row}><strong>Telefono:</strong> {phone}</Text>
        </Section>
        <Text style={text}>
          Se completerà il test, riceverai una seconda email con livello, punteggio ed errori.
        </Text>
        <Hr style={hr} />
        <Text style={footer}>Notifica automatica — Escape Campus</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: NewLeadAdminEmail,
  subject: (d: Record<string, any>) => `Nuovo lead: ${d.name ?? ''} (test non completato)`,
  displayName: 'Nuovo lead (admin)',
  previewData: {
    name: 'Marco Rossi',
    email: 'marco@example.com',
    phone: '+39 333 1234567',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '600px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: 'bold', color: '#141414', margin: '0 0 16px' }
const card = { backgroundColor: '#f7f7f7', borderRadius: '12px', padding: '14px 18px', margin: '0 0 16px' }
const row = { fontSize: '14px', color: '#141414', lineHeight: '1.7', margin: '0' }
const text = { fontSize: '14px', color: '#3a3a3a', margin: '0 0 12px' }
const hr = { borderColor: '#eaeaea', margin: '20px 0' }
const footer = { fontSize: '12px', color: '#999', margin: '0' }