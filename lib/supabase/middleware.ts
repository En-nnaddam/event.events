import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

function redirectWithCookies(request: NextRequest, response: NextResponse, pathname: string) {
  const url = request.nextUrl.clone()
  url.pathname = pathname
  url.search = ''

  const redirectResponse = NextResponse.redirect(url)
  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie)
  })

  return redirectResponse
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const { data } = await supabase.auth.getClaims()
  const user = data?.claims

  const pathname = request.nextUrl.pathname
  const isAuthRoute = pathname.startsWith('/auth')
  const isAdminLogin = pathname === '/admin/login'
  const isAdminRoute = pathname.startsWith('/admin') && !isAdminLogin
  const isProfileSetupRoute = pathname === '/profile/setup'
  const isUserRoute = pathname.startsWith('/user')
  const isProtectedRoute = isAdminRoute || isProfileSetupRoute || isUserRoute

  if (!user) {
    if (isAdminRoute) {
      return redirectWithCookies(request, supabaseResponse, '/admin/login')
    }

    if (isProtectedRoute) {
      return redirectWithCookies(request, supabaseResponse, '/auth')
    }

    return supabaseResponse
  }

  if (isAuthRoute || isAdminLogin || isProtectedRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role,full_name')
      .eq('id', user.sub)
      .maybeSingle<{ role: 'user' | 'admin'; full_name: string | null }>()

    if (!profile) {
      await supabase.auth.signOut()
      return redirectWithCookies(request, supabaseResponse, '/auth')
    }

    const hasCompletedProfile = Boolean(profile.full_name?.trim())
    const postLoginDestination =
      profile.role === 'admin' ? '/admin' : hasCompletedProfile ? '/' : '/profile/setup'
    const protectedDestination =
      profile.role === 'admin' ? '/admin' : hasCompletedProfile ? '/user' : '/profile/setup'

    if (isAuthRoute || isAdminLogin) {
      return redirectWithCookies(request, supabaseResponse, postLoginDestination)
    }

    if (isAdminRoute && profile.role !== 'admin') {
      return redirectWithCookies(request, supabaseResponse, protectedDestination)
    }

    if (isProfileSetupRoute && protectedDestination !== '/profile/setup') {
      return redirectWithCookies(request, supabaseResponse, protectedDestination)
    }

    if (isUserRoute && protectedDestination !== '/user') {
      return redirectWithCookies(request, supabaseResponse, protectedDestination)
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}
