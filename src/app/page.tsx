import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import {
  Package,
  ShoppingCart,
  BarChart3,
  Truck,
  Shield,
  Zap,
  Users,
  ArrowRight,
} from 'lucide-react'

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (session) {
    const role = (session.user as any)?.role
    if (role === 'MANAGER') redirect('/dashboard')
    else redirect('/pos')
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Package className="h-7 w-7 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">Trade Flow</span>
          </div>
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-gray-600 hover:text-gray-900">
              Features
            </a>
            <a href="#about" className="text-sm text-gray-600 hover:text-gray-900">
              About
            </a>
            <a href="#roles" className="text-sm text-gray-600 hover:text-gray-900">
              User Roles
            </a>
            <Link
              href="/login"
              className="rounded-md border border-blue-600 px-5 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Sign Up
            </Link>
          </nav>
          <div className="flex items-center gap-2 md:hidden">
            <Link
              href="/login"
              className="rounded-md border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-block rounded-full bg-blue-100 px-4 py-1.5 text-xs font-semibold text-blue-700">
              Wholesale Retail Management
            </div>
            <h1 className="mb-6 text-4xl font-bold leading-tight text-gray-900 md:text-5xl lg:text-6xl">
              Manage Your Business{' '}
              <span className="text-blue-600">Smarter, Not Harder</span>
            </h1>
            <p className="mb-8 text-lg text-gray-600 md:text-xl">
              Trade Flow is a complete wholesale retail management system. Track inventory,
              manage suppliers, process sales, and generate reports — all from one
              unified platform.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/signup"
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-8 py-3 text-base font-medium text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700"
              >
                Get Started <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="rounded-lg border border-gray-300 px-8 py-3 text-base font-medium text-gray-700 hover:bg-gray-50"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
        {/* Decorative gradient orbs */}
        <div className="pointer-events-none absolute -top-40 -right-40 h-80 w-80 rounded-full bg-blue-200 opacity-20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-indigo-200 opacity-20 blur-3xl" />
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold text-gray-900">
              Everything You Need to Run Your Business
            </h2>
            <p className="mx-auto max-w-2xl text-gray-600">
              From inventory tracking to sales processing, Trade Flow provides all the tools
              a wholesale or retail business needs to operate efficiently.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<Package className="h-6 w-6 text-blue-600" />}
              title="Inventory Management"
              description="Track stock levels in real-time, set minimum thresholds, and get low-stock alerts before you run out."
            />
            <FeatureCard
              icon={<ShoppingCart className="h-6 w-6 text-green-600" />}
              title="Point of Sale"
              description="Intuitive POS interface for staff to quickly process sales with support for cash, card, and mobile payments."
            />
            <FeatureCard
              icon={<BarChart3 className="h-6 w-6 text-purple-600" />}
              title="Reports & Analytics"
              description="Generate detailed sales and inventory reports. Export to PDF or Excel for further analysis."
            />
            <FeatureCard
              icon={<Truck className="h-6 w-6 text-orange-600" />}
              title="Supplier Management"
              description="Manage supplier information, log deliveries, and automatically update stock levels on receipt."
            />
            <FeatureCard
              icon={<Shield className="h-6 w-6 text-red-600" />}
              title="Role-Based Access"
              description="Separate Manager and Staff roles ensure the right people have access to the right features."
            />
            <FeatureCard
              icon={<Zap className="h-6 w-6 text-yellow-600" />}
              title="Real-Time Dashboard"
              description="At-a-glance overview of today's sales, transaction count, stock warnings, and recent activity."
            />
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="mb-4 text-3xl font-bold text-gray-900">About Trade Flow</h2>
              <p className="mb-4 text-gray-600 leading-relaxed">
                Trade Flow was designed to solve the everyday challenges faced by wholesale
                and retail businesses. Whether you are managing a single store or
                coordinating with multiple suppliers, our system streamlines your
                operations so you can focus on growing your business.
              </p>
              <p className="mb-4 text-gray-600 leading-relaxed">
                Built with modern web technologies including Next.js, PostgreSQL, and
                Prisma ORM, Trade Flow delivers a fast, reliable, and secure experience.
                The system runs entirely on your local network, keeping your business
                data private and under your control.
              </p>
              <p className="text-gray-600 leading-relaxed">
                From tracking every product in your warehouse to generating end-of-day
                reports, Trade Flow is the all-in-one solution your business needs.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <StatCard value="Real-Time" label="Stock Tracking" />
              <StatCard value="3" label="Payment Methods" />
              <StatCard value="PDF/Excel" label="Report Export" />
              <StatCard value="2" label="User Roles" />
            </div>
          </div>
        </div>
      </section>

      {/* User Roles Section */}
      <section id="roles" className="py-20 bg-gray-50">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold text-gray-900">User Roles</h2>
            <p className="mx-auto max-w-2xl text-gray-600">
              Trade Flow uses role-based access control to ensure each team member has
              exactly the tools they need.
            </p>
          </div>
          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
            <div className="rounded-xl border bg-white p-8 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-gray-900">Manager</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                  Full dashboard with KPIs and sales overview
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                  Add, edit, and delete products and categories
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                  Manage suppliers and log deliveries
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                  Generate and export sales and inventory reports
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                  Access to the POS screen
                </li>
              </ul>
            </div>
            <div className="rounded-xl border bg-white p-8 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-gray-900">Staff</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-green-600" />
                  Browse products and check stock availability
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-green-600" />
                  Add items to cart and process sales
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-green-600" />
                  Choose payment method (Cash, Card, Mobile)
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-green-600" />
                  View sale confirmation and receipt summary
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-green-600" />
                  View their own sales history
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-16 text-center shadow-xl">
            <h2 className="mb-4 text-3xl font-bold text-white">
              Ready to Get Started?
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-blue-100">
              Create an account or log in to access the Trade Flow management system
              and start running your business more efficiently.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-8 py-3 text-base font-medium text-blue-600 shadow-lg hover:bg-blue-50"
              >
                Create Account <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg border-2 border-white/50 px-8 py-3 text-base font-medium text-white hover:bg-white/10"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-8">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-gray-900">Trade Flow</span>
            </div>
            <p className="text-sm text-gray-500">
              Wholesale Retail Management System
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
    </div>
  )
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border bg-white p-6 text-center shadow-sm">
      <p className="text-2xl font-bold text-blue-600">{value}</p>
      <p className="mt-1 text-sm text-gray-500">{label}</p>
    </div>
  )
}
