export const PAYPAL_CURRENCY_CODE = 'USD'
export const SAR_PER_USD = 3.75

export function convertSarToPayPalAmount(sarAmount: number) {
  return Number((sarAmount / SAR_PER_USD).toFixed(2))
}

export function formatPayPalAmountLabel(sarAmount: number) {
  return `${convertSarToPayPalAmount(sarAmount).toFixed(2)} ${PAYPAL_CURRENCY_CODE}`
}
