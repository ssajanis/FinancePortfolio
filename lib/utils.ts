export function formatPaise(paise: number): string {
  const rupees = paise / 100
  return '₹' + rupees.toLocaleString('en-IN')
}

export function formatCrLakh(paise: number): string {
  const rupees = paise / 100
  if (rupees >= 10_000_000) {
    return '₹' + (rupees / 10_000_000).toFixed(2) + ' Cr'
  }
  if (rupees >= 100_000) {
    return '₹' + (rupees / 100_000).toFixed(2) + ' L'
  }
  return formatPaise(paise)
}
