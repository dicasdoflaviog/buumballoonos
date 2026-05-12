/**
 * Todos os templates de mensagem WhatsApp da Buum Balloon.
 * Centralizado aqui para fácil manutenção e edição de copy.
 */
export const WA_MESSAGES = {
  // ─── Pedidos ────────────────────────────────────────────────────────────────

  payment_confirmed: (name: string, orderNum: string, datetime: string) =>
    `✅ Pagamento recebido, ${name}!\n\nPedido ${orderNum} confirmado. 🎈\nRetirada: ${datetime}\n\nQualquer dúvida, é só chamar!`,

  production_started: (name: string, datetime: string) =>
    `🎈 Oi ${name}! Seu pedido entrou em produção!\n\nEstamos preparando tudo com muito carinho para você. 🥰\n\nRetirada: ${datetime}`,

  kit_ready: (name: string, time: string) =>
    `✨ ${name}, seu kit está pronto!\n\nPode vir retirar a partir de ${time}.\n\nTe esperamos na Urbis! 🎀`,

  delivery_thanks: (name: string, googleUrl: string) =>
    `🥰 Obrigada pela confiança, ${name}!\n\nEsperamos que a festinha tenha ficado incrível! ✨\n\nNos ajude com uma avaliação:\n⭐ ${googleUrl}\n\nE nos siga: @buumballoonn 🎈`,

  // ─── Follow-ups ──────────────────────────────────────────────────────────────

  follow_up_1: (name: string) =>
    `Oi ${name}! 🎈 Vi que você estava olhando nossos kits.\n\nTem alguma dúvida sobre tema, prazo ou valor? Me fala que te ajudo!`,

  follow_up_2: (name: string) =>
    `Oi ${name}! Passando para mostrar esse kit que ficou lindo hoje 😍\n\nQuer um assim? Me diz o tema e a data!`,

  follow_up_3: (name: string) =>
    `Oi ${name}! Última vez por aqui 😊\n\nAinda consigo garantir seu kit essa semana. Qual a data que você precisa?`,

  // ─── Mêsversário ─────────────────────────────────────────────────────────────

  mesversario_theme_reminder: (babyName: string, monthNum: number) =>
    `🌸 O ${babyName} completa ${monthNum} ${monthNum === 1 ? 'mês' : 'meses'} em 15 dias!\n\nJá escolheu o tema? Me fala que a gente já separa tudo! 🎀`,

  mesversario_payment_reminder: (
    name: string,
    babyName: string,
    date: string,
    amount: string,
    pixKey: string
  ) =>
    `💳 Olá ${name}!\n\nO mêsversário do ${babyName} é dia ${date}.\n\nValor: ${amount}\nPIX: ${pixKey}\n\nConfirme o pagamento para garantirmos a data! 🎈`,

  // ─── Pós-entrega ─────────────────────────────────────────────────────────────

  post_delivery_followup: (name: string) =>
    `Oi ${name}! 📸\n\nComo foi a festinha? A gente adoraria ver as fotos!\n\nNos marque no Instagram @buumballoonn 🥰`,

  birthday_greeting: (name: string, childName: string) =>
    `🎂 Parabéns para o ${childName}, ${name}!\n\nJá pensou na festinha? Temos novos temas lindos! Me fala se quiser ver 🎈`,

  reactivation: (name: string) =>
    `Oi ${name}! Saudades! 🎈\n\nTem alguma data especial chegando? Chegaram temas novos e adoraria montar algo para você!`,
} as const
