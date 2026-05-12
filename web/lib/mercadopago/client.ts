import MercadoPagoConfig, { Payment } from 'mercadopago'

/**
 * Cliente configurado do Mercado Pago SDK.
 * Usar para todas as operações com a API do MP.
 */
export const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
  options: {
    timeout: 10_000,
  },
})

/**
 * Instância do recurso Payment para buscar detalhes de pagamentos.
 */
export const mpPayment = new Payment(mpClient)
