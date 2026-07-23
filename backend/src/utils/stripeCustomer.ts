import Stripe from 'stripe'

export async function getValidStripeCustomerId(
  stripe: Stripe,
  customerId: string | null | undefined,
): Promise<string | null> {
  if (!customerId) return null

  try {
    const customer = await stripe.customers.retrieve(customerId)
    if ((customer as Stripe.DeletedCustomer).deleted) return null
    return customerId
  } catch (err: any) {
    if (err?.code === 'resource_missing') return null
    throw err
  }
}
