import { AppHeader } from "@/components/layout/app-header"

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <AppHeader />
      {children}
    </>
  )
}
