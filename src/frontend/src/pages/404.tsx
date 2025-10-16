import Link from 'next/link'
import { Button } from '../components/ui/button'

export default function Custom404() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-300">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Página não encontrada
          </h2>
          <p className="text-gray-600 mb-8">
            A página que você está procurando não existe ou foi movida.
          </p>
        </div>
        <Link href="/">
          <Button>
            Voltar para o início
          </Button>
        </Link>
      </div>
    </div>
  )
}
