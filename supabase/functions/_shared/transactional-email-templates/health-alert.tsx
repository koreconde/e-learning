import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
function HealthAlert({ day = '', summary = '' }: { day?: string; summary?: string }) {
  return <Html lang="it"><Head /><Preview>Un controllo giornaliero richiede attenzione</Preview><Body style={{ backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }}><Container style={{ padding: '24px', maxWidth: '600px' }}><Heading>English Infinity · controllo giornaliero</Heading><Text>{day}</Text><Text style={{ whiteSpace: 'pre-wrap', lineHeight: '1.7' }}>{summary}</Text><Text>I controlli non creano contatti né inviano codici WhatsApp. Non verificano i microfoni dei telefoni reali o l’arrivo dei contatti nei CRM.</Text></Container></Body></Html>
}
export const template = { component: HealthAlert, subject: 'English Infinity: controllo giornaliero da verificare', to: 'raff@escapecampus.it', displayName: 'Avviso monitoraggio giornaliero', previewData: { day: '2026-11-07', summary: 'Audio: servizio non disponibile.' } } satisfies TemplateEntry