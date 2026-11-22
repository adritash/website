// Test environment for Pulse. Uses the local services from scripts/pulse/dev-services.sh.
// Keys below are test-only values, generated for this suite; never use them elsewhere.
(process.env as Record<string, string>).NODE_ENV = "test";
process.env.PULSE_ENABLED = "true";
process.env.DATABASE_URL = process.env.PULSE_TEST_DATABASE_URL ?? "postgresql://pulse@localhost:54329/pulse_test";
process.env.REDIS_URL = process.env.PULSE_TEST_REDIS_URL ?? "redis://localhost:63799/1";
process.env.PULSE_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
process.env.PULSE_PHONE_HASH_KEY = Buffer.alloc(32, 9).toString("base64");
process.env.PULSE_SESSION_SECRET = "test-session-secret-not-for-production";
process.env.ADMIN_AUTH_SECRET = "test-admin-secret-not-for-production";
process.env.WHATSAPP_APP_SECRET = "test-app-secret";
process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN = "test-verify-token";
process.env.WHATSAPP_PHONE_NUMBER_ID = "123456789012345";
process.env.WHATSAPP_ACCESS_TOKEN = "test-access-token";
process.env.MARKET_DATA_PROVIDER = "sandbox";
process.env.AI_PROVIDER = "none";
process.env.RAZORPAY_WEBHOOK_SECRET = "test-razorpay-webhook-secret";
