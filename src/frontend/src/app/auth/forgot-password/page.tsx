"use client";

// Desabilitar pre-rendering estático para esta página
export const dynamic = 'force-dynamic';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Better Auth não tem reset de senha built-in, então vamos simular
      // Em uma implementação real, você usaria o plugin de email
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setEmailSent(true);
      alert("Email de recuperação enviado!");
    } catch (error: any) {
      alert("Erro ao enviar email de recuperação");
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <button
              onClick={() => router.back()}
              className="mb-4 px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="h-4 w-4 mr-2 inline" />
              Voltar
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Email enviado</h1>
            <p className="text-gray-600 mt-2">
              Verifique sua caixa de entrada
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">Email enviado com sucesso!</h3>
                <p className="text-gray-500 mt-2">
                  Enviamos um link de recuperação para <strong>{email}</strong>
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-500">
                  Não recebeu o email? Verifique sua pasta de spam ou
                </p>
                <button
                  onClick={() => setEmailSent(false)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Tentar novamente
                </button>
              </div>
              <div className="pt-4">
                <Link
                  href="/auth/login"
                  className="text-blue-600 hover:underline text-sm"
                >
                  Voltar para o login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <button
            onClick={() => router.back()}
            className="mb-4 px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2 inline" />
            Voltar
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Esqueceu sua senha?</h1>
          <p className="text-gray-600 mt-2">
            Não se preocupe, vamos te ajudar a recuperar
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="space-y-1 mb-6">
            <h2 className="text-2xl text-center font-semibold">Recuperar senha</h2>
            <p className="text-center text-gray-600">
              Digite seu email e enviaremos um link para redefinir sua senha
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50" 
              disabled={isLoading}
            >
              {isLoading ? "Enviando..." : "Enviar link de recuperação"}
            </button>

            <div className="text-center text-sm">
              <span className="text-gray-500">Lembrou da senha? </span>
              <Link href="/auth/login" className="text-blue-600 hover:underline">
                Fazer login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
