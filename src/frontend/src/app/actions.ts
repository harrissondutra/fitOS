'use server'

import webpush from 'web-push'

// Configurar VAPID details
webpush.setVapidDetails(
  'mailto:sistudofitness@gmail.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

// Armazenar subscriptions (em produção, usar banco de dados)
let subscriptions: PushSubscription[] = []

export async function subscribeUser(sub: PushSubscription) {
  try {
    // Em produção, salvar no banco de dados
    subscriptions.push(sub)
    
    console.log('User subscribed to push notifications')
    return { success: true }
  } catch (error) {
    console.error('Error subscribing user:', error)
    return { success: false, error: 'Failed to subscribe user' }
  }
}

export async function unsubscribeUser() {
  try {
    // Em produção, remover do banco de dados
    subscriptions = []
    
    console.log('User unsubscribed from push notifications')
    return { success: true }
  } catch (error) {
    console.error('Error unsubscribing user:', error)
    return { success: false, error: 'Failed to unsubscribe user' }
  }
}

export async function sendNotification(message: string) {
  if (subscriptions.length === 0) {
    throw new Error('No subscriptions available')
  }

  try {
    const notificationPayload = JSON.stringify({
      title: 'FitOS',
      body: message,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      data: {
        url: '/',
        timestamp: Date.now()
      }
    })

    // Enviar para todas as subscriptions
    const promises = subscriptions.map(subscription => 
      webpush.sendNotification(subscription as any, notificationPayload)
    )

    await Promise.all(promises)
    
    console.log('Notification sent successfully')
    return { success: true }
  } catch (error) {
    console.error('Error sending notification:', error)
    return { success: false, error: 'Failed to send notification' }
  }
}

export async function sendBulkNotification(title: string, body: string, data?: any) {
  if (subscriptions.length === 0) {
    throw new Error('No subscriptions available')
  }

  try {
    const notificationPayload = JSON.stringify({
      title,
      body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      data: {
        url: data?.url || '/',
        timestamp: Date.now(),
        ...data
      }
    })

    // Enviar para todas as subscriptions
    const promises = subscriptions.map(subscription => 
      webpush.sendNotification(subscription as any, notificationPayload)
    )

    await Promise.all(promises)
    
    console.log('Bulk notification sent successfully')
    return { success: true }
  } catch (error) {
    console.error('Error sending bulk notification:', error)
    return { success: false, error: 'Failed to send bulk notification' }
  }
}
