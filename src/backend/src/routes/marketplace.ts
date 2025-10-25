/**
 * Marketplace Routes - FitOS
 * 
 * Rotas para funcionalidades do marketplace
 */

import { Router } from 'express';
import { getPrismaClient } from '../config/database';
import { getAuthMiddleware } from '../middleware/auth.middleware';

const router = Router();
const authMiddleware = getAuthMiddleware(getPrismaClient());

// ============================================================================
// STORE MANAGEMENT ROUTES
// ============================================================================

/**
 * GET /api/marketplace/store/:userId
 * Busca dados da loja de um usuário específico
 */
router.get('/store/:userId', authMiddleware.requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const prisma = getPrismaClient();

    // Verificar se o usuário tem permissão para acessar esta loja
    const requestingUser = req.user;
    if (!requestingUser) {
      return res.status(401).json({ 
        error: 'Usuário não autenticado' 
      });
    }
    
    if (requestingUser.id !== userId && requestingUser.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ 
        error: 'Você não tem permissão para acessar esta loja' 
      });
    }

    // Buscar perfil do vendedor
    const sellerProfile = await prisma.marketplaceSellerProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            name: true,
            phone: true,
            role: true,
            status: true,
            emailVerified: true,
            image: true,
            createdAt: true,
            lastLogin: true,
            profile: true
          }
        }
      }
    });

    // Se não existe perfil, criar um básico
    if (!sellerProfile) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          name: true,
          phone: true,
          role: true,
          status: true,
          emailVerified: true,
          image: true,
          createdAt: true,
          lastLogin: true,
          profile: true
        }
      });

      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

        // Criar perfil básico
        const newProfile = await prisma.marketplaceSellerProfile.create({
          data: {
            userId,
            tenantId: requestingUser.tenantId || 'default-tenant',
            displayName: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Usuário',
            bio: `Loja especializada em produtos de fitness e bem-estar de ${user.name || 'Usuário'}.`,
            isVerified: user.emailVerified || false,
            badges: user.emailVerified ? ['Verified'] : [],
            commissionRate: 10,
            autoApprove: false,
            notifyNewOrder: true,
            notifyNewQuestion: true
          },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              name: true,
              phone: true,
              role: true,
              status: true,
              emailVerified: true,
              image: true,
              createdAt: true,
              lastLogin: true,
              profile: true
            }
          }
        }
      });

      return res.json({
        id: newProfile.id,
        name: newProfile.displayName,
        owner: newProfile.displayName,
        email: newProfile.user.email,
        phone: newProfile.user.phone || '',
        location: 'Brasil',
        foundedYear: newProfile.user.createdAt.getFullYear().toString(),
        description: newProfile.bio,
        verified: newProfile.isVerified,
        badges: newProfile.badges,
        specialties: ['Suplementos', 'Equipamentos', 'Roupas'],
        socialMedia: {
          website: '',
          instagram: '',
          facebook: ''
        },
        stats: {
          totalSales: newProfile.totalSales,
          monthlySales: 0,
          totalOrders: 0,
          monthlyOrders: 0,
          totalProducts: 0,
          activeProducts: 0,
          averageRating: newProfile.averageRating,
          totalReviews: 0,
          storeViews: 0,
          favorites: 0,
          conversionRate: 0,
          returnCustomers: 0
        },
        performance: {
          salesGrowth: 0,
          orderGrowth: 0,
          viewGrowth: 0,
          ratingTrend: 0
        }
      });
    }

    // Buscar estatísticas da loja
    const stats = await prisma.marketplaceListing.aggregate({
      where: {
        sellerId: userId,
        status: 'approved'
      },
      _count: {
        id: true
      }
    });

    const orders = await prisma.marketplaceOrder.aggregate({
      where: {
        sellerId: userId
      },
      _sum: {
        sellerAmount: true
      },
      _count: {
        id: true
      }
    });

    const reviews = await prisma.marketplaceReview.aggregate({
      where: {
        listing: {
          sellerId: userId
        }
      },
      _avg: {
        rating: true
      },
      _count: {
        id: true
      }
    });

    // Calcular vendas do mês atual
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const monthlyOrders = await prisma.marketplaceOrder.aggregate({
      where: {
        sellerId: userId,
        createdAt: {
          gte: currentMonth
        }
      },
      _sum: {
        sellerAmount: true
      },
      _count: {
        id: true
      }
    });

    return res.json({
      id: sellerProfile.id,
      name: sellerProfile.displayName,
      owner: sellerProfile.displayName,
      email: sellerProfile.user.email,
      phone: sellerProfile.user.phone || '',
      location: 'Brasil',
      foundedYear: sellerProfile.user.createdAt.getFullYear().toString(),
      description: sellerProfile.bio,
      verified: sellerProfile.isVerified,
      badges: sellerProfile.badges,
      specialties: ['Suplementos', 'Equipamentos', 'Roupas'],
      socialMedia: {
        website: '',
        instagram: '',
        facebook: ''
      },
      stats: {
        totalSales: orders._sum.sellerAmount || 0,
        monthlySales: monthlyOrders._sum.sellerAmount || 0,
        totalOrders: orders._count.id || 0,
        monthlyOrders: monthlyOrders._count.id || 0,
        totalProducts: stats._count.id || 0,
        activeProducts: stats._count.id || 0,
        averageRating: reviews._avg.rating || 0,
        totalReviews: reviews._count.id || 0,
        storeViews: 0,
        favorites: 0,
        conversionRate: 0,
        returnCustomers: 0
      },
      performance: {
        salesGrowth: 0,
        orderGrowth: 0,
        viewGrowth: 0,
        ratingTrend: 0
      }
    });

  } catch (error) {
    console.error('Erro ao buscar dados da loja:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor ao buscar dados da loja' 
    });
  }
});

/**
 * PUT /api/marketplace/store/:userId
 * Atualiza dados da loja de um usuário
 */
router.put('/store/:userId', authMiddleware.requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;
    const prisma = getPrismaClient();

    // Verificar se o usuário tem permissão para atualizar esta loja
    const requestingUser = req.user;
    if (!requestingUser) {
      return res.status(401).json({ 
        error: 'Usuário não autenticado' 
      });
    }
    
    if (requestingUser.id !== userId && requestingUser.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ 
        error: 'Você não tem permissão para atualizar esta loja' 
      });
    }

    // Atualizar perfil do vendedor
    const updatedProfile = await prisma.marketplaceSellerProfile.upsert({
      where: { userId },
      update: {
        displayName: updateData.name,
        bio: updateData.description,
        logo: updateData.logo,
        coverImage: updateData.coverImage,
        badges: updateData.badges || [],
        updatedAt: new Date()
      },
      create: {
        userId,
        tenantId: requestingUser.tenantId || 'default-tenant',
        displayName: updateData.name,
        bio: updateData.description,
        logo: updateData.logo,
        coverImage: updateData.coverImage,
        badges: updateData.badges || [],
        isVerified: false,
        commissionRate: 10,
        autoApprove: false,
        notifyNewOrder: true,
        notifyNewQuestion: true
      }
    });

    // Atualizar dados do usuário se necessário
    if (updateData.phone) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          phone: updateData.phone
        }
      });
    }

    res.json({
      success: true,
      message: 'Dados da loja atualizados com sucesso',
      data: updatedProfile
    });

  } catch (error) {
    console.error('Erro ao atualizar dados da loja:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor ao atualizar dados da loja' 
    });
  }
});

// ============================================================================
// LISTINGS ROUTES
// ============================================================================

/**
 * GET /api/marketplace/listings
 * Lista produtos de um vendedor
 */
router.get('/listings', authMiddleware.requireAuth, async (req, res) => {
  try {
    const { sellerId, status, categoryId, page = 1, limit = 10 } = req.query;
    const prisma = getPrismaClient();

    const where: any = {};
    
    if (sellerId) {
      where.sellerId = sellerId;
    }
    
    if (status) {
      where.status = status;
    }
    
    if (categoryId) {
      where.categoryId = categoryId;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [listings, total] = await Promise.all([
      prisma.marketplaceListing.findMany({
        where,
        include: {
          category: true,
          seller: {
            select: {
              id: true,
              name: true,
              firstName: true,
              lastName: true,
              image: true
            }
          },
          _count: {
            select: {
              reviews: true,
              favorites: true,
              orders: true
            }
          }
        },
        skip,
        take: Number(limit),
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.marketplaceListing.count({ where })
    ]);

    res.json({
      listings,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });

  } catch (error) {
    console.error('Erro ao buscar listagens:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor ao buscar listagens' 
    });
  }
});

/**
 * GET /api/marketplace/listings/:id
 * Busca uma listagem específica
 */
router.get('/listings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const prisma = getPrismaClient();

    const listing = await prisma.marketplaceListing.findUnique({
      where: { id },
      include: {
        category: true,
        seller: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            image: true
          }
        },
        reviews: {
          include: {
            reviewer: {
              select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true,
                image: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        },
        questions: {
          include: {
            asker: {
              select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true,
                image: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        },
        variations: true,
        _count: {
          select: {
            reviews: true,
            favorites: true,
            orders: true
          }
        }
      }
    });

    if (!listing) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    // Incrementar contador de visualizações
    await prisma.marketplaceListing.update({
      where: { id },
      data: {
        viewCount: {
          increment: 1
        }
      }
    });

    return res.json(listing);

  } catch (error) {
    console.error('Erro ao buscar listagem:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor ao buscar listagem' 
    });
  }
});

// ============================================================================
// ORDERS ROUTES
// ============================================================================

/**
 * GET /api/marketplace/orders
 * Lista pedidos de um vendedor ou comprador
 */
router.get('/orders', authMiddleware.requireAuth, async (req, res) => {
  try {
    const { role, page = 1, limit = 10, status } = req.query;
    const requestingUser = req.user;
    
    if (!requestingUser) {
      return res.status(401).json({ 
        error: 'Usuário não autenticado' 
      });
    }
    
    const userId = requestingUser.id;
    const prisma = getPrismaClient();

    const where: any = {};
    
    if (role === 'seller') {
      where.sellerId = userId;
    } else if (role === 'buyer') {
      where.buyerId = userId;
    }
    
    if (status) {
      where.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      prisma.marketplaceOrder.findMany({
        where,
        include: {
          listing: {
            select: {
              id: true,
              title: true,
              thumbnailUrl: true,
              price: true
            }
          },
          buyer: {
            select: {
              id: true,
              name: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          seller: {
            select: {
              id: true,
              name: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        skip,
        take: Number(limit),
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.marketplaceOrder.count({ where })
    ]);

    res.json({
      orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });

  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor ao buscar pedidos' 
    });
  }
});

// ============================================================================
// CATEGORIES ROUTES
// ============================================================================

/**
 * GET /api/marketplace/categories
 * Lista todas as categorias
 */
router.get('/categories', async (req, res) => {
  try {
    const prisma = getPrismaClient();

    const categories = await prisma.marketplaceCategory.findMany({
      where: {
        isActive: true
      },
      include: {
        children: {
          where: {
            isActive: true
          },
          orderBy: {
            order: 'asc'
          }
        },
        _count: {
          select: {
            listings: true
          }
        }
      },
      orderBy: {
        order: 'asc'
      }
    });

    res.json(categories);

  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor ao buscar categorias' 
    });
  }
});

// ============================================================================
// ADMIN ROUTES
// ============================================================================

/**
 * GET /api/marketplace/admin/stats
 * Estatísticas gerais do marketplace (apenas SUPER_ADMIN)
 */
router.get('/admin/stats', authMiddleware.requireAuth, async (req, res) => {
  try {
    const prisma = getPrismaClient();

    const [
      totalListings,
      totalOrders,
      totalRevenue,
      totalSellers,
      totalBuyers,
      pendingApprovals
    ] = await Promise.all([
      prisma.marketplaceListing.count(),
      prisma.marketplaceOrder.count(),
      prisma.marketplaceOrder.aggregate({
        _sum: {
          totalAmount: true
        }
      }),
      prisma.marketplaceSellerProfile.count(),
      prisma.user.count({
        where: {
          buyerOrders: {
            some: {}
          }
        }
      }),
      prisma.marketplaceListing.count({
        where: {
          approvalStatus: 'pending'
        }
      })
    ]);

    res.json({
      totalListings,
      totalOrders,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      totalSellers,
      totalBuyers,
      pendingApprovals
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas do marketplace:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor ao buscar estatísticas' 
    });
  }
});

export default router;
