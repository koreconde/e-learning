/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as testResultLead } from './test-result-lead.tsx'
import { template as testResultAdmin } from './test-result-admin.tsx'
import { template as newLeadAdmin } from './new-lead-admin.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'test-result-lead': testResultLead,
  'test-result-admin': testResultAdmin,
  'new-lead-admin': newLeadAdmin,
}