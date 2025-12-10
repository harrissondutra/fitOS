'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import * as Icons from '@fortawesome/free-brands-svg-icons'

interface ProviderIconProps {
  providerId: string
  iconUrl?: string // URL pública do SVG
  emoji?: string
  className?: string
  size?: number
}

/**
 * Mapeamento de provider IDs para ícones Font Awesome
 * Adicione novos provedores aqui quando necessário
 */
const PROVIDER_ICON_MAP: Record<string, IconDefinition> = {
  // LLMs populares
  'openai': Icons.faOpenai,
  'google': Icons.faGoogle,
  'gemini': Icons.faGoogle, // Gemini é do Google
  'anthropic': Icons.faAmazon, // Anthropic não tem ícone próprio
  'mistral': Icons.faMicrosoft, // Aproximação
  'cohere': Icons.faGoogle, // Aproximação
  'groq': Icons.faGoogle, // Aproximação
  'deepseek': Icons.faGoogle, // Aproximação
  'meta': Icons.faMeta,
  'microsoft': Icons.faMicrosoft,
  'aws': Icons.faAws, // AWS existe como faAws (minúsculas)
  'azure': Icons.faMicrosoft,
  // 'ibm': Icons.faIBM, // IBM não tem ícone no Font Awesome Brands
  'huggingface': Icons.faGit,
  'github': Icons.faGithub,
  // 'nvidia': Icons.faNvidia, // NVIDIA não tem ícone no Font Awesome Brands
  'perplexity': Icons.faGoogle, // Aproximação
  'together': Icons.faGoogle, // Aproximação
  'xai': Icons.faXTwitter, // xAI (Twitter/X)
}

/**
 * URLs públicas de SVGs para provedores LLM
 * Fontes: brandsoftheworld.com, svgrepo.com, etc.
 */
const PROVIDER_SVG_URLS: Record<string, string> = {
  'openai': 'https://cdn.svgrepo.com/show/364167/openai.svg',
  'google': 'https://cdn.svgrepo.com/show/303108/google-icon-logo.svg',
  'gemini': 'https://cdn.svgrepo.com/show/303108/google-icon-logo.svg',
  'anthropic': 'https://www.svgrepo.com/show/505939/claude.svg',
  'mistral': 'https://www.svgrepo.com/show/521700/ai.svg',
  'cohere': 'https://www.svgrepo.com/show/521700/ai.svg',
  'groq': 'https://www.svgrepo.com/show/521700/ai.svg',
  'deepseek': 'https://www.svgrepo.com/show/521700/ai.svg',
  'meta': 'https://cdn.svgrepo.com/show/303108/meta-icon-logo.svg',
  'microsoft': 'https://cdn.svgrepo.com/show/303108/microsoft-icon-logo.svg',
  'aws': 'https://cdn.svgrepo.com/show/303108/aws-icon-logo.svg',
  'azure': 'https://cdn.svgrepo.com/show/303108/microsoft-azure-icon-logo.svg',
  'ibm': 'https://cdn.svgrepo.com/show/303108/ibm-icon-logo.svg',
  'huggingface': 'https://cdn.svgrepo.com/show/303108/huggingface-icon-logo.svg',
  'github': 'https://cdn.svgrepo.com/show/303108/github-icon-logo.svg',
  'nvidia': 'https://cdn.svgrepo.com/show/303108/nvidia-icon-logo.svg',
  'perplexity': 'https://www.svgrepo.com/show/521700/ai.svg',
  'together': 'https://www.svgrepo.com/show/521700/ai.svg',
  'xai': 'https://cdn.svgrepo.com/show/303108/x-twitter-icon-logo.svg',
}

/**
 * Componente para renderizar ícones SVG dos provedores LLM
 * Prioridade:
 * 1. URL pública fornecida (iconUrl prop)
 * 2. URL pública do mapeamento (PROVIDER_SVG_URLS)
 * 3. Font Awesome Brands (quando disponível)
 * 4. SVG local em /public/icons/llm-providers/
 * 5. Emoji fallback
 */
export function ProviderIcon({ 
  providerId, 
  iconUrl,
  emoji, 
  className = '', 
  size = 24 
}: ProviderIconProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [svgUrl, setSvgUrl] = useState<string | null>(null)
  const [shouldDownload, setShouldDownload] = useState(false)

  // Determinar qual URL usar (prioridade: prop > mapeamento)
  const publicSvgUrl = iconUrl || PROVIDER_SVG_URLS[providerId.toLowerCase()]

  // Verificar se Font Awesome tem o ícone
  const faIcon = PROVIDER_ICON_MAP[providerId.toLowerCase()]

  // Caminho do SVG local
  const localSvgPath = `/icons/llm-providers/${providerId.toLowerCase()}.svg`

  useEffect(() => {
    // Resetar estado quando providerId mudar
    setImageError(false)
    setImageLoaded(false)
    setSvgUrl(null)
    setShouldDownload(false)
  }, [providerId, iconUrl])

  // Tentar carregar SVG de URL pública primeiro
  useEffect(() => {
    if (publicSvgUrl && !imageError && !imageLoaded) {
      // Verificar se a imagem carrega
      const img = new window.Image()
      img.onload = () => {
        setImageLoaded(true)
        setSvgUrl(publicSvgUrl)
      }
      img.onerror = () => {
        setImageError(true)
        // Se falhar, tentar Font Awesome ou fallback
      }
      img.src = publicSvgUrl
    }
  }, [publicSvgUrl, imageError, imageLoaded])

  // Se a URL pública não carregar, tentar baixar
  useEffect(() => {
    if (publicSvgUrl && imageError && !shouldDownload && !faIcon) {
      // Tentar baixar o SVG
      fetch(publicSvgUrl)
        .then(res => res.text())
        .then(svgContent => {
          // Salvar localmente (isso seria feito no backend, mas por enquanto só logamos)
          console.log(`[ProviderIcon] SVG baixado para ${providerId}:`, svgContent.substring(0, 100))
          // Por enquanto, apenas tentar usar o SVG baixado em memória
          const blob = new Blob([svgContent], { type: 'image/svg+xml' })
          const url = URL.createObjectURL(blob)
          setSvgUrl(url)
          setImageLoaded(true)
        })
        .catch(err => {
          console.warn(`[ProviderIcon] Falha ao baixar SVG para ${providerId}:`, err)
          setShouldDownload(true)
        })
    }
  }, [publicSvgUrl, imageError, shouldDownload, providerId, faIcon])

  // Se temos URL pública carregada, usar
  if (svgUrl && imageLoaded) {
    return (
      <Image
        src={svgUrl}
        alt={providerId}
        width={size}
        height={size}
        className={className}
        unoptimized
        onError={() => setImageError(true)}
      />
    )
  }

  // Se temos Font Awesome, usar
  if (faIcon && (imageError || !publicSvgUrl)) {
    return (
      <FontAwesomeIcon
        icon={faIcon}
        className={className}
        style={{ width: size, height: size }}
      />
    )
  }

  // Tentar SVG local
  if (!imageLoaded && !imageError) {
    return (
      <Image
        src={localSvgPath}
        alt={providerId}
        width={size}
        height={size}
        className={className}
        unoptimized
        onError={() => {
          setImageError(true)
        }}
        onLoad={() => setImageLoaded(true)}
      />
    )
  }

  // Fallback: emoji
  return emoji ? (
    <span className={className} style={{ fontSize: size, lineHeight: 1 }}>
      {emoji}
    </span>
  ) : (
    <span className={className} style={{ fontSize: size, lineHeight: 1 }}>
      🤖
    </span>
  )
}

