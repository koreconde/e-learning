import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface ErrorItem {
  questionNumber: number
  level: string
  skill: string
  prompt: string
  userAnswer: string
  correctAnswer: string
}

interface TestResultAdminProps {
  name?: string
  email?: string
  phone?: string
  level?: string
  score?: number
  total?: number
  errors?: ErrorItem[]
}

const TestResultAdminEmail = ({
  name = '',
  email = '',
  phone = '',
  level = 'A1',
  score = 0,
  total = 20,
  errors = [],
}: TestResultAdminProps) => (
  <Html lang="it" dir="ltr">
    <Head />
    <Preview>Nuovo lead: {name} — livello {level} ({score}/{total})</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Nuovo lead test inglese</Heading>

        <Section style={card}>
          <Text style={row}><strong>Nome:</strong> {name}</Text>
          <Text style={row}><strong>Email:</strong> {email}</Text>
          <Text style={row}><strong>Telefono:</strong> {phone}</Text>
          <Text style={row}><strong>Livello CEFR:</strong> {level}</Text>
          <Text style={row}><strong>Punteggio:</strong> {score} / {total}</Text>
        </Section>

        <Heading as="h2" style={h2}>Errori ({errors.length})</Heading>
        {errors.length === 0 ? (
          <Text style={text}>Nessun errore.</Text>
        ) : (
          errors.map((e) => (
            <Section key={e.questionNumber} style={errorCard}>
              <Text style={errorMeta}>Q{e.questionNumber} · {e.level} · {e.skill}</Text>
              <Text style={errorPrompt}>{e.prompt}</Text>
              <Text style={errorLine}>
                Risposta lead: <span style={errorWrong}>{e.userAnswer || '(nessuna)'}</span>
              </Text>
              <Text style={errorLine}>
                Corretta: <span style={errorRight}>{e.correctAnswer}</span>
              </Text>
            </Section>
          ))
        )}

        <Hr style={hr} />
        <Text style={footer}>Notifica automatica — Escape Campus</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: TestResultAdminEmail,
  subject: (d: Record<string, any>) =>
    `Nuovo lead: ${d.name ?? ''} — ${d.level ?? ''} (${d.score ?? 0}/${d.total ?? 20})`,
  displayName: 'Risultato test (admin)',
  previewData: {
    name: 'Marco Rossi',
    email: 'marco@example.com',
    phone: '+39 333 1234567',
    level: 'B1',
    score: 12,
    total: 20,
    errors: [
      {
        questionNumber: 5,
        level: 'A2',
        skill: 'Grammar',
        prompt: 'She ___ to the gym every day.',
        userAnswer: 'go',
        correctAnswer: 'goes',
      },
    ],
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '600px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: 'bold', color: '#141414', margin: '0 0 16px' }
const h2 = { fontSize: '17px', fontWeight: 'bold', color: '#141414', margin: '20px 0 10px' }
const card = { backgroundColor: '#f7f7f7', borderRadius: '12px', padding: '14px 18px', margin: '0 0 16px' }
const row = { fontSize: '14px', color: '#141414', lineHeight: '1.7', margin: '0' }
const text = { fontSize: '14px', color: '#3a3a3a', margin: '0 0 12px' }
const errorCard = { border: '1px solid #e5e5e5', borderRadius: '10px', padding: '12px 14px', margin: '0 0 10px' }
const errorMeta = { fontSize: '11px', fontWeight: 'bold', color: '#777', textTransform: 'uppercase' as const, letterSpacing: '0.08em', margin: '0 0 6px' }
const errorPrompt = { fontSize: '13px', color: '#141414', margin: '0 0 8px', fontWeight: 600 }
const errorLine = { fontSize: '13px', color: '#3a3a3a', margin: '2px 0' }
const errorWrong = { color: '#c62828', fontWeight: 600 }
const errorRight = { color: '#1b8a3a', fontWeight: 600 }
const hr = { borderColor: '#eaeaea', margin: '20px 0' }
const footer = { fontSize: '12px', color: '#999', margin: '0' }