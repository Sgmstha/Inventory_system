// Format currency in Nepalese Rupees (NPR)
export function formatNPR(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

// Format large numbers with Indian numbering system (lakhs, crores)
export function formatNPRCompact(amount: number): string {
  if (amount >= 10000000) {
    // 1 crore = 10,000,000
    return `Rs. ${(amount / 10000000).toFixed(2)} Cr`
  } else if (amount >= 100000) {
    // 1 lakh = 100,000
    return `Rs. ${(amount / 100000).toFixed(2)} L`
  } else if (amount >= 1000) {
    return `Rs. ${(amount / 1000).toFixed(1)}K`
  }
  return `Rs. ${amount.toFixed(2)}`
}
