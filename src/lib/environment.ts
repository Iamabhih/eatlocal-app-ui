export const ENV = {
  MODE: import.meta.env.MODE,
  isDevelopment: import.meta.env.MODE === 'development',
  isStaging: import.meta.env.MODE === 'staging',
  isProduction: import.meta.env.MODE === 'production',
  
  // Supabase
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  SUPABASE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_PROJECT_ID: import.meta.env.VITE_SUPABASE_PROJECT_ID,
  
  // PayFast
  PAYFAST_MODE: import.meta.env.MODE === 'production' ? 'production' : 'sandbox',
  PAYFAST_URL: import.meta.env.MODE === 'production' 
    ? 'https://www.payfast.co.za/eng/process'
    : 'https://sandbox.payfast.co.za/eng/process',
} as const;
