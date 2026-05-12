# SPEC.md — Buum OS · Fase 1 MVP
> Implementação cirúrgica. Leia este arquivo inteiro antes de escrever qualquer código.
> Cada seção = um bloco de implementação. Execute na ordem.

---

## Pré-requisitos antes de começar

1. Ler `CLAUDE.md` na raiz do projeto
2. Criar projeto Next.js 14: `npx create-next-app@latest buumos --typescript --tailwind --app`
3. Inicializar Supabase CLI: `npx supabase init`
4. Instalar shadcn: `npx shadcn@latest init`
5. Instalar dependências:

```bash
npm install @supabase/supabase-js @supabase/ssr \
  mercadopago \
  @ducanh2912/next-pwa \
  date-fns \
  axios \
  zod \
  react-hook-form @hookform/resolvers \
  lucide-react \
  clsx tailwind-merge
```

6. Instalar componentes shadcn necessários:
```bash
npx shadcn@latest add button card badge input select dialog sheet tabs form calendar label textarea separator skeleton toast
```

---

## BLOCO 1 — Configuração base

### 1.1 `tailwind.config.ts`
Adicionar cores customizadas da Buum:

```typescript
extend: {
  colors: {
    buum: {
      rosa: '#FF3D7F',
      lilas: '#C084FC',
      verde: '#06D6A0',
      amarelo: '#FFD166',
      escuro: '#0D0A14',
    }
  }
}
```

### 1.2 `next.config.ts`
Configurar next-pwa e domínios de imagem:

```typescript
import withPWA from '@ducanh2912/next-pwa'

const config = withPWA({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
})({
  images: {
    domains: ['your-supabase-project.supabase.co']
  }
})

export default config
```

### 1.3 `public/manifest.json`
PWA manifest completo:

```json
{
  "name": "Buum OS",
  "short_name": "Buum OS",
  "description": "Sistema operacional da Buum Balloon",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0D0A14",
  "theme_color": "#FF3D7F",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### 1.4 `.env.local`
Criar com todas as variáveis do CLAUDE.md (seção Variáveis de Ambiente).

### 1.5 `middleware.ts`
Proteger rotas do dashboard — redirecionar para /login se não autenticado:

```typescript
import { createMiddlewareClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res: response })
  const { data: { session } } = await supabase.auth.getSession()

  const isAuthRoute = request.nextUrl.pathname.startsWith('/login')
  const isDashboard = request.nextUrl.pathname.startsWith('/')

  if (!session && isDashboard && !isAuthRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|manifest.json).*)']
}
```

---

## BLOCO 2 — Supabase e utilitários

### 2.1 `lib/supabase/client.ts`
Criar browser client com createBrowserClient do `@supabase/ssr`.

### 2.2 `lib/supabase/server.ts`
Criar server client com createServerClient do `@supabase/ssr`.
Usar cookies() do Next.js para sessão.

### 2.3 `supabase/migrations/001_initial_schema.sql`
Copiar exatamente o SQL da seção "Schema SQL completo" do PRD.md.
Executar com: `npx supabase db push`

### 2.4 `supabase/seed.sql`
Copiar exatamente o seed do PRD.md.
Executar com: `npx supabase db seed`

### 2.5 `lib/utils/formatters.ts`
Criar as seguintes funções (todas exportadas):

```typescript
// formatCurrency(centavos: number): string → "R$ 80,00"
// formatDate(date: string | Date): string → "14/06/2026"
// formatDateTime(date: string | Date): string → "14/06/2026 às 14:00"
// formatPhone(phone: string): string → "(73) 9 9999-9999"
// formatCPF(cpf: string): string → "000.000.000-00"
// formatOrderNumber(num: number): string → "#001"
```

### 2.6 `lib/utils/validators.ts`
Criar funções:
```typescript
// validateCPF(cpf: string): boolean
// encryptCPF(cpf: string): string  ← usar crypto com ENCRYPTION_KEY do env
// decryptCPF(encrypted: string): string
// validatePhone(phone: string): boolean
// formatPhoneE164(phone: string): string → "5573999999999"
```

### 2.7 `lib/utils/constants.ts`
Criar objetos de configuração:

```typescript
export const ORDER_STATUS_LABELS = {
  novo: 'Novo',
  confirmado: 'Confirmado',
  em_producao: 'Em produção',
  pronto: 'Pronto para retirada',
  retirado: 'Retirado',
  entregue: 'Entregue',
  cancelado: 'Cancelado'
}

export const ORDER_STATUS_COLORS = {
  novo: 'bg-gray-100 text-gray-800',
  confirmado: 'bg-blue-100 text-blue-800',
  em_producao: 'bg-yellow-100 text-yellow-800',
  pronto: 'bg-purple-100 text-purple-800',
  retirado: 'bg-green-100 text-green-800',
  entregue: 'bg-green-200 text-green-900',
  cancelado: 'bg-red-100 text-red-800'
}

export const OCCASION_TAGS = {
  aniversario: '🎂 Aniversário',
  mesversario: '🎈 Mêsversário',
  namoro: '💑 Namoro',
  escola: '🎒 Escola',
  trabalho: '🏢 Trabalho',
  batizado: '✝️ Batizado',
  cha: '🍼 Chá',
  outro: '🎉 Outro'
}

export const DELIVERY_TYPES = {
  retirada: '🏪 Retirada na loja',
  entrega_nossa: '🚗 Entrega nossa',
  cliente_app: '📱 Cliente pede app'
}

export const MESVERSARIO_PLANS = {
  basico: { label: 'Básico', price: 12000 },
  memoria: { label: 'Memória ⭐', price: 18000 },
  celebracao: { label: 'Celebração', price: 28000 }
}
```

---

## BLOCO 3 — WhatsApp (Evolution API)

### 3.1 `lib/whatsapp/evolution.ts`
Criar wrapper com as seguintes funções:

```typescript
// sendText(phone: string, message: string): Promise<void>
//   → POST ${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}
//   → body: { number: phone, text: message }
//   → header: { apikey: EVOLUTION_API_KEY }

// sendImage(phone: string, imageUrl: string, caption: string): Promise<void>
//   → POST ${EVOLUTION_API_URL}/message/sendMedia/${EVOLUTION_INSTANCE}

// getConnectionStatus(): Promise<'open' | 'close'>
//   → GET ${EVOLUTION_API_URL}/instance/connectionState/${EVOLUTION_INSTANCE}
```

Todas as chamadas devem ter try/catch.
Em caso de erro, logar no console e NÃO lançar exceção (não quebrar o fluxo do app).

### 3.2 `lib/whatsapp/messages.ts`
Criar objeto WA_MESSAGES com TODOS os templates:

```typescript
export const WA_MESSAGES = {
  payment_confirmed: (name: string, orderNum: string, datetime: string) =>
    `✅ Pagamento recebido, ${name}!\n\nPedido ${orderNum} confirmado. 🎈\nRetirada: ${datetime}\n\nQualquer dúvida, é só chamar!`,

  production_started: (name: string, datetime: string) =>
    `🎈 Oi ${name}! Seu pedido entrou em produção!\n\nEstamos preparando tudo com muito carinho para você. 🥰\n\nRetirada: ${datetime}`,

  kit_ready: (name: string, time: string) =>
    `✨ ${name}, seu kit está pronto!\n\nPode vir retirar a partir de ${time}.\n\nTe esperamos na Urbis! 🎀`,

  delivery_thanks: (name: string, googleUrl: string) =>
    `🥰 Obrigada pela confiança, ${name}!\n\nEsperamos que a festinha tenha ficado incrível! ✨\n\nNos ajude com uma avaliação:\n⭐ ${googleUrl}\n\nE nos siga: @buumballoonn 🎈`,

  follow_up_1: (name: string) =>
    `Oi ${name}! 🎈 Vi que você estava olhando nossos kits.\n\nTem alguma dúvida sobre tema, prazo ou valor? Me fala que te ajudo!`,

  follow_up_2: (name: string) =>
    `Oi ${name}! Passando para mostrar esse kit que ficou lindo hoje 😍\n\nQuer um assim? Me diz o tema e a data!`,

  follow_up_3: (name: string) =>
    `Oi ${name}! Última vez por aqui 😊\n\nAinda consigo garantir seu kit essa semana. Qual a data que você precisa?`,

  mesversario_theme_reminder: (babyName: string, monthNum: number) =>
    `🌸 O ${babyName} completa ${monthNum} ${monthNum === 1 ? 'mês' : 'meses'} em 15 dias!\n\nJá escolheu o tema? Me fala que a gente já separa tudo! 🎀`,

  mesversario_payment_reminder: (name: string, babyName: string, date: string, amount: string, pixKey: string) =>
    `💳 Olá ${name}!\n\nO mêsversário do ${babyName} é dia ${date}.\n\nValor: ${amount}\nPIX: ${pixKey}\n\nConfirme o pagamento para garantirmos a data! 🎈`,

  post_delivery_followup: (name: string) =>
    `Oi ${name}! 📸\n\nComo foi a festinha? A gente adoraria ver as fotos!\n\nNos marque no Instagram @buumballoonn 🥰`,

  birthday_greeting: (name: string, childName: string) =>
    `🎂 Parabéns para o ${childName}, ${name}!\n\nJá pensou na festinha? Temos novos temas lindos! Me fala se quiser ver 🎈`,

  reactivation: (name: string) =>
    `Oi ${name}! Saudades! 🎈\n\nTem alguma data especial chegando? Chegaram temas novos e adoraria montar algo para você!`,
}
```

### 3.3 `lib/whatsapp/automations.ts`
Criar funções de automação:

```typescript
// onOrderStatusChange(orderId, newStatus, customerPhone, customerName, extraData)
//   → Baseado no newStatus, chama o template correto do WA_MESSAGES
//   → Registra em automation_logs (success ou fail)

// sendPaymentConfirmation(order, customer)
// sendProductionStarted(order, customer)
// sendKitReady(order, customer)
// sendDeliveryThanks(order, customer)

// Cada função:
//   1. Chama evolution.sendText()
//   2. Salva em whatsapp_messages (direction: outbound, automation_type: 'nome_da_automacao')
//   3. Salva em automation_logs
```

### 3.4 `app/api/webhooks/whatsapp/route.ts`
Receber mensagens inbound da Evolution API:

```typescript
export async function POST(req: NextRequest) {
  const body = await req.json()

  // Evolution API envia: { event: 'messages.upsert', data: { key, message, ... } }
  if (body.event === 'messages.upsert') {
    const message = body.data
    if (message.key.fromMe) return NextResponse.json({ ok: true }) // ignorar mensagens enviadas por nós

    // Salvar mensagem inbound no banco
    await saveInboundMessage(message)
  }

  return NextResponse.json({ ok: true })
}
```

---

## BLOCO 4 — Mercado Pago

### 4.1 `lib/mercadopago/client.ts`
Inicializar SDK do Mercado Pago:

```typescript
import MercadoPagoConfig from 'mercadopago'

export const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!
})
```

### 4.2 `lib/mercadopago/webhooks.ts`
Criar função processPaymentWebhook:

```typescript
export async function processPaymentWebhook(paymentId: string) {
  // 1. Buscar detalhes do pagamento via API MP
  // 2. Se status === 'approved':
  //    a. Buscar payment no banco pelo mp_payment_id
  //    b. Se não encontrar: buscar order pelo external_reference
  //    c. Atualizar payment.status = 'recebido', payment.received_at = NOW()
  //    d. Recalcular total pago vs total do pedido
  //    e. Se pago integralmente: atualizar order.status = 'confirmado'
  //    f. Chamar sendPaymentConfirmation(order, customer)
  // 3. Registrar em automation_logs
}
```

### 4.3 `app/api/webhooks/mercadopago/route.ts`
Endpoint do webhook — validar assinatura HMAC antes de processar:

```typescript
export async function POST(req: NextRequest) {
  // 1. Validar assinatura: header x-signature com HMAC SHA256
  // 2. Se inválido: return 401
  // 3. Se body.type === 'payment': processPaymentWebhook(body.data.id)
  // 4. Retornar 200 sempre (MP retry se não receber 200)
}
```

---

## BLOCO 5 — Auth e Layout

### 5.1 `app/(auth)/login/page.tsx`
Tela de login simples:
- Logo Buum Balloon (texto, sem imagem por agora)
- Input email + senha
- Botão "Entrar"
- Usar signInWithPassword do Supabase Auth
- Após login: redirecionar para `/`
- Mobile-first, centralizado verticalmente

### 5.2 `app/(auth)/layout.tsx`
Layout sem sidebar, fundo escuro `bg-buum-escuro`, centralizado.

### 5.3 `app/(dashboard)/layout.tsx`
Layout principal:
- Sidebar fixa em desktop (240px)
- Sheet (drawer) em mobile, aberta por hamburger no header
- Sidebar contém: Logo, links de navegação, badge de role do usuário
- Links: Dashboard, Pedidos, Clientes, Mêsversário, Sair

### 5.4 `components/shared/sidebar.tsx`
Navegação lateral com os links acima.
Destacar link ativo baseado no pathname atual.
Avatar do usuário no rodapé com nome e role.

### 5.5 `components/shared/header.tsx`
Header mobile:
- Botão hamburger (abre sidebar como Sheet)
- Logo centralizado
- Ícone de sino (notificações — sem funcionalidade por agora, só UI)

### 5.6 `components/shared/kpi-card.tsx`
Card reutilizável:
```typescript
interface KPICardProps {
  label: string
  value: string | number
  subtitle?: string
  icon?: LucideIcon
  color?: 'rosa' | 'lilas' | 'verde' | 'amarelo'
  trend?: 'up' | 'down' | 'neutral'
}
```

---

## BLOCO 6 — Dashboard Home

### 6.1 `app/(dashboard)/page.tsx`
Dashboard com:

**KPIs (4 cards em grid 2x2 mobile, 4x1 desktop):**
1. Faturamento do mês (soma de payments recebidos no mês atual)
2. Pedidos em aberto (status: novo | confirmado | em_producao | pronto)
3. Mêsversários ativos (contratos com status: ativo)
4. Receita recorrente (MRR = contratos ativos × monthly_price)

**Lista de próximas entregas (5 pedidos):**
- Pedidos com pickup_datetime nos próximos 3 dias
- Mostrar: cliente, status badge, data/hora, valor total

**Atalhos rápidos:**
- Botão "+ Novo Pedido" (link para /pedidos/novo)
- Botão "+ Novo Cliente"

---

## BLOCO 7 — Módulo de Pedidos (M1)

### 7.1 `hooks/use-orders.ts`
Criar hook com:
```typescript
// useOrders(filters?: { status?, customer_id?, date_from?, date_to? })
//   → retorna: orders[], isLoading, error
//   → usa Supabase realtime para atualização automática

// useOrder(id: string)
//   → retorna: order com items e payments, isLoading, error

// createOrder(data: CreateOrderInput): Promise<Order>
// updateOrderStatus(id: string, status: OrderStatus): Promise<void>
//   → após update, chamar onOrderStatusChange da automations.ts
// deleteOrder(id: string): Promise<void>
```

### 7.2 `hooks/use-payments.ts`
```typescript
// usePayments(orderId: string)
// addPayment(data: AddPaymentInput): Promise<Payment>
// updatePaymentStatus(id: string, status: PaymentStatus): Promise<void>
```

### 7.3 `app/actions/orders.ts`
Server actions:
- `createOrder(data)` — cria pedido + itens, retorna order
- `updateOrder(id, data)` — atualiza campos do pedido
- `updateOrderStatus(id, status)` — atualiza status + dispara automação
- `addOrderItem(orderId, item)` — adiciona item ao pedido
- `updateOrderItem(id, data)` — atualiza item (incluindo price override)
- `removeOrderItem(id)` — remove item
- `calculateOrderTotal(orderId)` — recalcula subtotal e total do pedido

### 7.4 `app/(dashboard)/pedidos/page.tsx`
Lista de pedidos:
- Busca por nome do cliente ou número do pedido
- Filtro por status (tabs: Todos | Em aberto | Prontos | Concluídos)
- Filtro por data de entrega
- Card por pedido com: nº pedido, cliente, status badge, data/hora, valor total, botão de ação rápida
- Botão "+ Novo Pedido" no header da página
- Ordenação padrão: pickup_datetime ASC (mais próximo primeiro)

### 7.5 `app/(dashboard)/pedidos/novo/page.tsx`
Formulário de criação em steps (mobile-friendly):

**Step 1 — Cliente:**
- Campo de busca de cliente existente (autocomplete por nome/telefone)
- Botão "Novo cliente" (abre modal com form mínimo)
- Tag de ocasião (select com OCCASION_TAGS)

**Step 2 — Itens:**
- Buscar produto do catálogo (dropdown com busca)
- Adicionar quantidade
- Editar preço do item (override — campo visível apenas para admin e operator)
- Nota do item (campo de tema/personalização)
- Lista de itens adicionados com subtotal
- Total calculado em tempo real

**Step 3 — Entrega:**
- Tipo de entrega (radio: retirada | entrega_nossa | cliente_app)
- Data e hora (date/time picker)
- Endereço (aparece apenas se entrega_nossa)
- Observações gerais do pedido

**Step 4 — Pagamento:**
- Forma de pagamento (select)
- Valor recebido agora (pode ser parcial — sinal)
- Valor restante (calculado automaticamente)
- Nota do pagamento

**Botão final:** "Criar Pedido"
→ Chama createOrder server action
→ Se houver pagamento no step 4, chama addPayment também
→ Redirecionar para /pedidos/[id] do pedido criado

### 7.6 `app/(dashboard)/pedidos/[id]/page.tsx`
Detalhe do pedido com abas:

**Aba "Pedido":**
- Header: nº pedido, status badge (clicável para mudar), cliente
- Itens com preços (editáveis por operator e admin)
- Botão "Adicionar item"
- Total final

**Aba "Pagamentos":**
- Lista de pagamentos com status (pendente/recebido)
- Progresso: quanto foi pago vs total
- Botão "Registrar pagamento"
- Modal de novo pagamento (método + valor + nota)

**Aba "Entrega":**
- Tipo de entrega + data/hora
- Timeline de status do pedido (visual, tipo stepper)
- Botão de mudança de status (próximo passo)

**Aba "Checklist" (para operator e helper):**
- Lista dos itens do pedido
- Checkbox por item
- Contador: X de Y itens conferidos
- Botão "Confirmar pronto" (aparece quando todos marcados) → muda status para `pronto` → dispara WhatsApp
- Segunda conferência: botão "Confirmar entrega/retirada" → muda para `entregue` → dispara WhatsApp de agradecimento

### 7.7 `components/pedidos/order-items-editor.tsx`
Componente de edição de itens:
- Exibir produto, quantidade, preço base, preço override (se houver)
- Botão para editar preço do item (modal com input)
- Botão para remover item
- Ao salvar preço override: chamar updateOrderItem + recalcular total

### 7.8 `components/pedidos/payment-panel.tsx`
Painel de pagamentos:
- Barra de progresso (valor pago / valor total)
- Lista de pagamentos registrados
- Status de cada um (badge verde = recebido, amarelo = pendente)
- Botão "+ Registrar pagamento"

### 7.9 `components/pedidos/checklist-panel.tsx`
- Lista de checkboxes baseada nos order_items
- Cada item mostra: produto + quantidade + tema (se tiver nota)
- Só marca quando confere fisicamente
- Botões de confirmação condicionais ao progresso

---

## BLOCO 8 — Módulo de Clientes (M2 básico)

### 8.1 `hooks/use-customers.ts`
```typescript
// useCustomers(search?: string)
// useCustomer(id: string) → retorna customer + orders + relacionamentos
// createCustomer(data: CreateCustomerInput): Promise<Customer>
// updateCustomer(id: string, data: Partial<Customer>): Promise<Customer>
// searchCustomers(query: string): Promise<Customer[]>  ← para autocomplete no form de pedido
```

### 8.2 `app/actions/customers.ts`
- `createCustomer(data)` — encripta CPF antes de salvar
- `updateCustomer(id, data)`
- `addCustomerRelationship(customerId, data)`
- `addCustomerTag(customerId, tag)`
- `removeCustomerTag(customerId, tag)`

### 8.3 `app/(dashboard)/clientes/page.tsx`
- Lista com busca por nome, telefone, bairro
- Filtro por tag (VIP, Presenteador, etc.)
- Card com: nome, telefone, bairro, total de pedidos, LTV (valor total gasto)
- Ordenação: mais recente, maior LTV, nome A-Z

### 8.4 `app/(dashboard)/clientes/[id]/page.tsx`
Perfil do cliente:
- Header: nome, telefone, bairro, tags coloridas
- Dados: email, CPF (mascarado), Instagram, gênero, tipo (compradora/presenteador), origem
- Relacionamentos: lista de quem ela costuma presentear (com datas de aniversário)
- Histórico de pedidos: lista de todos os pedidos com valor e status
- Botão "Novo pedido para este cliente"

### 8.5 `components/clientes/customer-form.tsx`
Formulário com campos:
- Obrigatórios: full_name, phone
- Opcionais: cpf, email, neighborhood, address, instagram, gender, customer_type, source
- Validação de CPF (formato) antes de encriptar
- Formatação automática de telefone

---

## BLOCO 9 — Módulo Mêsversário (M3)

### 9.1 `hooks/use-mesversario.ts`
```typescript
// useContracts() → lista de contratos ativos com próximo mês
// useContract(id: string) → contrato + todos os 12 meses
// createContract(data: CreateContractInput): Promise<Contract>
//   → Server action que cria contrato + gera os 12 meses automaticamente
// updateMonthTheme(monthId: string, theme: string): Promise<void>
// updateMonthStatus(monthId: string, status: MonthStatus): Promise<void>
```

### 9.2 `app/actions/mesversario.ts`
- `createContract(data)` — cria contrato + gera os 12 meses com datas calculadas (addMonths)
- `updateContract(id, data)`
- `updateMonth(id, data)` — atualizar tema, status, foto, vincular pedido
- `cancelContract(id)` — muda status para cancelado

### 9.3 `app/(dashboard)/mesversario/page.tsx`
Lista de contratos:
- Cards de contratos ativos com: nome do bebê, mês atual (#3 de 12), próxima data, plano, valor mensal
- Contador: "X contratos ativos · R$X.XXX de MRR"
- Botão "+ Novo contrato"
- Destaque para contratos com mêsversário nos próximos 15 dias

### 9.4 `app/(dashboard)/mesversario/[id]/page.tsx`
Detalhe do contrato:
- Header: nome do bebê, plano, valor, status
- Dados da mãe (link para perfil do cliente)
- Timeline visual dos 12 meses:
  - Meses concluídos: verde com foto (se houver)
  - Mês atual: destacado com tema confirmado e botão de ação
  - Próximos meses: agendados com data e tema pendente
- Botão "Criar pedido para este mês" — pré-preenche com cliente e mêsversário

### 9.5 `components/mesversario/month-timeline.tsx`
Timeline visual dos 12 meses:
- Grid horizontal em desktop, vertical em mobile
- Cada mês: bolinha colorida (agendado=cinza, tema_confirmado=azul, produzindo=amarelo, entregue=verde)
- Ao clicar num mês: expandir com detalhes (tema, data, foto, pedido vinculado)
- Mês atual sempre destacado

### 9.6 `components/mesversario/contract-form.tsx`
Formulário de criação:
- Busca de cliente (autocomplete)
- Nome do bebê + data de nascimento
- Plano (radio com preços)
- Data de início (primeiro mêsversário)
- Desconto anual (toggle — registra mas não calcula desconto automaticamente na Fase 1)
- Preview: mostra os 12 meses que serão gerados

---

## BLOCO 10 — Realtime e notificações

### 10.1 `hooks/use-realtime.ts`
Subscrição ao Supabase Realtime para:
- `orders` — atualizar lista quando novo pedido é criado ou status muda
- `payments` — atualizar quando pagamento webhook chega

```typescript
// useOrdersRealtime(callback: (order: Order) => void)
// usePaymentsRealtime(orderId: string, callback: () => void)
```

### 10.2 Integrar realtime no dashboard
Em `app/(dashboard)/page.tsx`:
- Usar useOrdersRealtime para atualizar KPIs sem precisar recarregar página
- Toast notification quando novo pedido chega

---

## BLOCO 11 — Testes de automação

### 11.1 Testar webhook Mercado Pago localmente
- Usar ngrok: `ngrok http 3000`
- Configurar URL do ngrok no painel MP como webhook
- Fazer pagamento PIX de teste e verificar:
  - payment.status atualiza no banco
  - order.status muda para 'confirmado'
  - WhatsApp chega no número de teste

### 11.2 Testar Evolution API
- Confirmar que a instância está conectada: `getConnectionStatus()`
- Enviar mensagem de teste para número pessoal
- Verificar que foi salvo em whatsapp_messages

### 11.3 Testar PWA
- Abrir no celular via HTTPS (Vercel preview)
- Verificar banner "Adicionar à tela inicial"
- Verificar que abre em modo standalone (sem barra do browser)

---

## Ordem de execução recomendada

```
BLOCO 1 → Setup e configuração (30 min)
BLOCO 2 → Supabase + utilitários (1h)
  ↳ Rodar migration + seed
BLOCO 3 → WhatsApp Evolution API (1h)
  ↳ Testar envio de mensagem antes de continuar
BLOCO 4 → Mercado Pago webhook (1h)
  ↳ Testar com ngrok antes de continuar
BLOCO 5 → Auth + Layout (1.5h)
  ↳ Garantir que login funciona e sidebar aparece
BLOCO 6 → Dashboard Home (1h)
BLOCO 7 → Módulo Pedidos (4-5h) ← maior bloco
  ↳ Testar checklist → WhatsApp antes de continuar
BLOCO 8 → Módulo Clientes (2h)
BLOCO 9 → Módulo Mêsversário (2h)
BLOCO 10 → Realtime (1h)
BLOCO 11 → Testes (1h)
```

**Total estimado: 15-18h de sessões no Claude Code**
**Recomendação: 1 bloco por sessão, sempre começar com `/clear` e carregar CLAUDE.md + SPEC.md**

---

## Como usar esta SPEC no Claude Code

Para cada bloco, iniciar sessão assim:

```
Leia o CLAUDE.md e o SPEC.md na raiz do projeto.

Vamos implementar o BLOCO [N] da SPEC: [nome do bloco].

Antes de começar:
1. Liste os arquivos que você vai criar ou modificar
2. Confirme que nenhum desses arquivos já existe
3. Implemente seguindo exatamente o que está na SPEC

Não crie nenhum arquivo que não esteja listado na SPEC deste bloco.
```

---

*SPEC.md · Buum OS · Fase 1 · Maio 2026 · Versão 1.0*
