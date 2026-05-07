import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Escape Campus'

interface ErrorItem {
  questionNumber: number
  level: string
  skill: string
  prompt: string
  userAnswer: string
  correctAnswer: string
}

interface TestResultLeadProps {
  name?: string
  level?: string
  score?: number
  total?: number
  errors?: ErrorItem[]
}

const TestResultLeadEmail = ({
  name,
  level = 'A1',
  score = 0,
  total = 20,
  errors = [],
}: TestResultLeadProps) => (
  <Html lang="it" dir="ltr">
    <Head />
    <Preview>Il tuo livello di inglese: {level} — analisi dettagliata degli errori</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>
          {name ? `Ciao ${name},` : 'Ciao,'} il tuo livello è {level}
        </Heading>
        <Text style={text}>
          Hai risposto correttamente a <strong>{score}</strong> domande su <strong>{total}</strong>.
          Di seguito trovi l'analisi dettagliata degli errori per aiutarti a capire dove migliorare.
        </Text>

        <Section style={levelBox}>
          <Text style={levelLabel}>Livello CEFR</Text>
          <Text style={levelValue}>{level}</Text>
        </Section>

        {errors.length > 0 ? (
          <>
            <Heading as="h2" style={h2}>I tuoi errori ({errors.length})</Heading>
            {errors.map((e) => (
              <Section key={e.questionNumber} style={errorCard}>
                <Text style={errorMeta}>
                  Domanda {e.questionNumber} · {e.level} · {e.skill}
                </Text>
                <Text style={errorPrompt}>{e.prompt}</Text>
                <Text style={errorLine}>
                  <span style={errorLabel}>La tua risposta: </span>
                  <span style={errorWrong}>{e.userAnswer || '(nessuna risposta)'}</span>
                </Text>
                <Text style={errorLine}>
                  <span style={errorLabel}>Risposta corretta: </span>
                  <span style={errorRight}>{e.correctAnswer}</span>
                </Text>
              </Section>
            ))}
          </>
        ) : (
          <Text style={text}>
            Complimenti! Non hai commesso errori valutabili automaticamente.
          </Text>
        )}

        <Hr style={hr} />
        <Text style={footer}>
          Vuoi un piano di studio personalizzato? Prenota uno Speaking Test gratuito di 30 minuti
          con un Cambridge Teacher su <a href="https://calendly.com/francescafilipp" style={link}>calendly.com/francescafilipp</a>.
        </Text>
        <Text style={footer}>— Il team {SITE_NAME}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: TestResultLeadEmail,
  subject: (d: Record<string, any>) =>
    `Il tuo livello di inglese: ${d.level ?? ''} — analisi dettagliata`,
  displayName: 'Risultato test (lead)',
  previewData: {
    name: 'Marco',
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
const h1 = { fontSize: '24px', fontWeight: 'bold', color: '#141414', margin: '0 0 16px' }
const h2 = { fontSize: '18px', fontWeight: 'bold', color: '#141414', margin: '24px 0 12px' }
const text = { fontSize: '15px', color: '#3a3a3a', lineHeight: '1.6', margin: '0 0 16px' }
const levelBox = {
  backgroundColor: '#FACC3D',
  borderRadius: '16px',
  padding: '20px',
  textAlign: 'center' as const,
  margin: '20px 0',
}
const levelLabel = { fontSize: '12px', fontWeight: 'bold', color: '#141414', textTransform: 'uppercase' as const, letterSpacing: '0.1em', margin: '0' }
const levelValue = { fontSize: '48px', fontWeight: 900, color: '#141414', margin: '4px 0 0' }
const errorCard = {
  border: '1px solid #e5e5e5',
  borderRadius: '12px',
  padding: '14px 16px',
  margin: '0 0 12px',
}
const errorMeta = { fontSize: '11px', fontWeight: 'bold', color: '#777', textTransform: 'uppercase' as const, letterSpacing: '0.08em', margin: '0 0 6px' }
const errorPrompt = { fontSize: '14px', color: '#141414', margin: '0 0 10px', fontWeight: 600 }
const errorLine = { fontSize: '13px', color: '#3a3a3a', margin: '2px 0' }
const errorLabel = { color: '#777' }
const errorWrong = { color: '#c62828', fontWeight: 600 }
const errorRight = { color: '#1b8a3a', fontWeight: 600 }
const hr = { borderColor: '#eaeaea', margin: '24px 0' }
const footer = { fontSize: '13px', color: '#777', lineHeight: '1.6', margin: '0 0 8px' }
const link = { color: '#1276B5', textDecoration: 'underline' }