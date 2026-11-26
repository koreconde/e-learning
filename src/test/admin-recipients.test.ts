import { describe, expect, it } from 'vitest';
import { ADMIN_NOTIFICATION_RECIPIENTS } from '../lib/admin-recipients';

describe('admin notification recipients', () => {
  it('never notifies the mailboxes that bounce or refuse our emails', () => {
    expect(ADMIN_NOTIFICATION_RECIPIENTS).not.toContain('giada@escapecampus.it');
    expect(ADMIN_NOTIFICATION_RECIPIENTS).not.toContain('info@englishinfinity.io');
  });

  it('still notifies the working admin mailboxes', () => {
    expect(ADMIN_NOTIFICATION_RECIPIENTS).toContain('raff@escapecampus.it');
    expect(ADMIN_NOTIFICATION_RECIPIENTS).toContain('francesca@escapecampus.it');
  });
});
