import { NextPageContext } from 'next'
import Link from 'next/link'
import { Button } from '../components/ui/button'

interface ErrorProps {
  statusCode?: number
}

export default function Error({ statusCode }: ErrorProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-300">
            {statusCode || '500'}
          </h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            {statusCode === 404 ? 'Página não encontrada' : 'Erro interno do servidor'}
          </h2>
          <p className="text-gray-600 mb-8">
            {statusCode === 404 
              ? 'A página que você está procurando não existe.'
              : 'Algo deu errado. Tente novamente mais tarde.'
            }
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

Error.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}
