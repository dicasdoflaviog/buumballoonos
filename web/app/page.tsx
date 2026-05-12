// Esta rota é coberta por app/(dashboard)/page.tsx via route group.
// Redirect de segurança caso o middleware deixe passar sem autenticação.
import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/')
}
