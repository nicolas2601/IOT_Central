import { redirect } from 'next/navigation';

/**
 * Página principal
 * Redirige automáticamente al dashboard
 */
export default function Home() {
  redirect('/dashboard');
}
