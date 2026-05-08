import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET ?? 'dev_secret_fallback'

export const TEST_USER = {
  id:    'user_test_001',
  email: process.env.TEST_EMAIL ?? 'test@tradedesk.io',
  plan:  'pro',
}

export function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '24h' })
}

export function verifyToken(token) {
  if (!token) return null
  try {
    return jwt.verify(token, SECRET)
  } catch {
    return null
  }
}

// Stripe subscription gate.
// DEMO_MODE=true → always active so the socket stays open.
// Production: replace with a real Stripe API call.
export async function checkSubscription(userId) {
  if (process.env.DEMO_MODE === 'true') {
    return { active: true, plan: 'pro' }
  }
  // Phase 2: const customer = await stripe.customers.retrieve(userId) …
  return { active: false, plan: null }
}
