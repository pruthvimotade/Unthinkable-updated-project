export function formatINR(value: number | string | any): string {
  const numValue = typeof value === "string" ? parseFloat(value) : Number(value);
  if (isNaN(numValue)) return "₹0.00";
  
  return new Intl.NumberFormat('en-IN', { 
    style: 'currency', 
    currency: 'INR', 
    maximumFractionDigits: 2 
  }).format(numValue);
}
