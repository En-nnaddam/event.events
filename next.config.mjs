/** @type {import('next').NextConfig} */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

function getSupabaseImagePattern() {
  if (!supabaseUrl) {
    return null
  }

  try {
    const url = new URL(supabaseUrl)

    return {
      protocol: url.protocol.replace(":", ""),
      hostname: url.hostname,
      pathname: "/storage/v1/object/public/event-images/**",
    }
  } catch {
    return null
  }
}

const supabaseImagePattern = getSupabaseImagePattern()

const nextConfig = {
  images: {
    remotePatterns: supabaseImagePattern ? [supabaseImagePattern] : [],
  },
}

export default nextConfig
