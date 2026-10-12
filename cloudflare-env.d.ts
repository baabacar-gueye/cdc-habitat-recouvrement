declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    RESEND_API_KEY?: string;
    INVITE_FROM?: string;
    APP_ORIGIN?: string;
    BUCKET?: R2Bucket;
  }
}
