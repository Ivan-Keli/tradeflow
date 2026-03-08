import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const role = req.nextauth.token?.role
    const path = req.nextUrl.pathname

    const managerRoutes = ['/dashboard', '/inventory', '/suppliers', '/reports']
    const isManagerRoute = managerRoutes.some((r) => path.startsWith(r))

    if (isManagerRoute && role !== 'MANAGER') {
      return NextResponse.redirect(new URL('/pos', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/inventory/:path*',
    '/suppliers/:path*',
    '/reports/:path*',
    '/pos/:path*',
  ],
}
