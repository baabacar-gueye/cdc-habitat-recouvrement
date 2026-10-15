import { getDb } from '@/db/client.mjs';

export const env = {
  get DB() {
    return getDb();
  },
  get APP_ORIGIN() {
    return process.env.APP_ORIGIN;
  },
  get INVITE_FROM() {
    return process.env.INVITE_FROM;
  },
  get RESEND_API_KEY() {
    return process.env.RESEND_API_KEY;
  },
};
