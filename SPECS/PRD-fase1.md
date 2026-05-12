# PRD.md — Buum OS · Fase 1 MVP
> Documento de pesquisa e contexto para geração da SPEC.
> Leia este documento inteiro antes de gerar qualquer código.

---

## Objetivo da Fase 1

Construir o MVP do Buum OS que substitui completamente a Agendaboa.
Ao final da Fase 1, Flávio e Joane devem conseguir:

1. Criar um pedido com múltiplos itens
2. Registrar pagamento parcial (sinal) e total
3. Acompanhar status do pedido em tempo real
4. Filho marcar checklist → dispara WhatsApp automático
5. Receber webhook do Mercado Pago → atualiza pedido → WhatsApp automático
6. Gerenciar contratos de mêsversário com calendário automático
7. Ver CRM básico de clientes com histórico de compras

---

## Módulos da Fase 1

### M1 — Gestão de Pedidos (core)
### M2 — CRM de Clientes (básico)
### M3 — Módulo Mêsversário
### Infra — Auth, WhatsApp, Mercado Pago, PWA

---

## Arquivos que precisam ser CRIADOS (do zero)

### Setup e configuração
- `package.json` — Next.js 14, TypeScript, Tailwind, shadcn, Supabase, Mercado Pago SDK
- `next.config.ts` — PWA config (next-pwa), image domains
- `middleware.ts` — proteção de rotas autenticadas
- `tailwind.config.ts` — cores customizadas Buum
- `public/manifest.json` — PWA manifest (nome, ícones, cores)

### Supabase
- `supabase/migrations/001_initial_schema.sql` — todas as tabelas da Fase 1
- `supabase/seed.sql` — catálogo inicial de produtos Buum
- `lib/supabase/client.ts` — browser Supabase client
- `lib/supabase/server.ts` — server Supabase client
- `lib/supabase/types.ts` — tipos gerados (rodar CLI depois)

### Auth
- `app/(auth)/login/page.tsx` — tela de login
- `app/(auth)/register/page.tsx` — tela de cadastro (apenas admin usa)
- `app/(auth)/layout.tsx` — layout sem sidebar

### Layout principal
- `app/(dashboard)/layout.tsx` — sidebar + header + proteção auth
- `app/(dashboard)/page.tsx` — dashboard home com KPIs
- `components/shared/sidebar.tsx` — navegação lateral
- `components/shared/header.tsx` — header mobile com hamburger
- `components/shared/kpi-card.tsx` — card reutilizável de métricas

### Pedidos (M1)
- `app/(dashboard)/pedidos/page.tsx` — lista com filtros de status e busca
- `app/(dashboard)/pedidos/novo/page.tsx` — criar pedido (form completo)
- `app/(dashboard)/pedidos/[id]/page.tsx` — detalhe + editar + checklist
- `components/pedidos/order-form.tsx` — formulário de pedido
- `components/pedidos/order-card.tsx` — card de pedido na lista
- `components/pedidos/order-status-badge.tsx` — badge de status colorido
- `components/pedidos/order-items-editor.tsx` — adicionar/remover/editar itens com price override
- `components/pedidos/payment-panel.tsx` — registrar pagamentos (sinal + total)
- `components/pedidos/checklist-panel.tsx` — checklist do filho (view simplificada)
- `components/pedidos/delivery-info.tsx` — tipo entrega + data/hora
- `hooks/use-orders.ts` — CRUD de pedidos
- `hooks/use-order-items.ts` — itens do pedido
- `hooks/use-payments.ts` — pagamentos
- `app/actions/orders.ts` — server actions de pedidos

### Clientes (M2 básico)
- `app/(dashboard)/clientes/page.tsx` — lista com busca e filtros
- `app/(dashboard)/clientes/[id]/page.tsx` — perfil completo + histórico
- `components/clientes/customer-form.tsx` — form de cadastro/edição
- `components/clientes/customer-card.tsx` — card na lista
- `components/clientes/customer-history.tsx` — histórico de pedidos
- `hooks/use-customers.ts` — CRUD de clientes
- `app/actions/customers.ts` — server actions de clientes

### Mêsversário (M3)
- `app/(dashboard)/mesversario/page.tsx` — lista de contratos ativos
- `app/(dashboard)/mesversario/[id]/page.tsx` — contrato + calendário dos 12 meses
- `components/mesversario/contract-form.tsx` — criar contrato
- `components/mesversario/month-timeline.tsx` — linha do tempo dos 12 meses
- `components/mesversario/month-card.tsx` — card de cada mêsversário
- `hooks/use-mesversario.ts` — CRUD de contratos e meses
- `app/actions/mesversario.ts` — server actions (criar contrato gera 12 meses automaticamente)

### WhatsApp (Evolution API)
- `lib/whatsapp/evolution.ts` — wrapper com sendText, sendImage, getMessages
- `lib/whatsapp/messages.ts` — TODOS os templates de mensagem centralizados
- `lib/whatsapp/automations.ts` — funções de automação (sendPaymentConfirmation, sendKitReady, etc.)
- `app/api/webhooks/whatsapp/route.ts` — receber mensagens inbound da Evolution API

### Mercado Pago (PIX)
- `lib/mercadopago/client.ts` — configuração do SDK
- `lib/mercadopago/webhooks.ts` — processar webhook de pagamento
- `app/api/webhooks/mercadopago/route.ts` — endpoint do webhook MP

### Utilitários
- `lib/utils/formatters.ts` — formatCurrency, formatDate, formatPhone, formatCPF
- `lib/utils/validators.ts` — validateCPF, encryptCPF, decryptCPF
- `lib/utils/constants.ts` — STATUS_LABELS, OCCASION_TAGS, DELIVERY_TYPES

---

## Arquivos que precisam ser MODIFICADOS

(Nenhum — projeto do zero)

---

## Schema SQL completo — Fase 1

```sql
-- Habilitar extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Profiles (extensão de auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'operator', 'helper')),
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clientes
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  cpf_encrypted TEXT,
  email TEXT,
  neighborhood TEXT,
  city TEXT DEFAULT 'Teixeira de Freitas',
  address TEXT,
  instagram TEXT,
  gender TEXT CHECK (gender IN ('F', 'M', 'O')),
  customer_type TEXT DEFAULT 'buyer' CHECK (customer_type IN ('buyer', 'gifter')),
  source TEXT CHECK (source IN ('meta_ads', 'referral', 'organic', 'whatsapp')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Relacionamentos de clientes
CREATE TABLE customer_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  related_name TEXT NOT NULL,
  related_type TEXT NOT NULL CHECK (related_type IN ('filho', 'cônjuge', 'mãe', 'pai', 'amigo', 'outro')),
  birth_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tags de clientes
CREATE TABLE customer_tags (
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  tag TEXT NOT NULL CHECK (tag IN ('VIP', 'mesversario_ativo', 'presenteador', 'indicadora', 'inativa_30d', 'escola', 'corporativo')),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  added_by UUID REFERENCES profiles(id),
  PRIMARY KEY (customer_id, tag)
);

-- Produtos (catálogo)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('kit', 'grafica', 'avulso', 'servico')),
  base_price INTEGER NOT NULL CHECK (base_price >= 0),
  description TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pedidos
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number SERIAL UNIQUE,
  customer_id UUID NOT NULL REFERENCES customers(id),
  status TEXT NOT NULL DEFAULT 'novo' CHECK (status IN ('novo', 'confirmado', 'em_producao', 'pronto', 'retirado', 'entregue', 'cancelado')),
  delivery_type TEXT NOT NULL CHECK (delivery_type IN ('retirada', 'entrega_nossa', 'cliente_app')),
  pickup_datetime TIMESTAMPTZ NOT NULL,
  subtotal INTEGER DEFAULT 0,
  total INTEGER DEFAULT 0,
  notes TEXT,
  occasion_tag TEXT CHECK (occasion_tag IN ('aniversario', 'mesversario', 'namoro', 'escola', 'trabalho', 'batizado', 'cha', 'outro')),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Itens do pedido
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price INTEGER NOT NULL,
  unit_price_override INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Função: preço final do item
CREATE OR REPLACE FUNCTION get_item_final_price(item order_items)
RETURNS INTEGER AS $$
  SELECT COALESCE(item.unit_price_override, item.unit_price) * item.quantity;
$$ LANGUAGE SQL STABLE;

-- Pagamentos
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount > 0),
  method TEXT NOT NULL CHECK (method IN ('pix', 'dinheiro', 'cartao_debito', 'cartao_credito')),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'recebido', 'estornado')),
  mp_payment_id TEXT,
  mp_status TEXT,
  received_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contratos de mêsversário
CREATE TABLE mesversario_contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  baby_name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('basico', 'memoria', 'celebracao')),
  monthly_price INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'pausado', 'concluido', 'cancelado')),
  start_date DATE NOT NULL,
  end_date DATE,
  annual_discount BOOLEAN DEFAULT FALSE,
  annual_paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meses do mêsversário
CREATE TABLE mesversario_months (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID NOT NULL REFERENCES mesversario_contracts(id) ON DELETE CASCADE,
  month_number INTEGER NOT NULL CHECK (month_number BETWEEN 1 AND 12),
  scheduled_date DATE NOT NULL,
  theme TEXT,
  order_id UUID REFERENCES orders(id),
  photo_url TEXT,
  status TEXT NOT NULL DEFAULT 'agendado' CHECK (status IN ('agendado', 'tema_confirmado', 'produzindo', 'entregue')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contract_id, month_number)
);

-- Mensagens WhatsApp
CREATE TABLE whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id),
  phone TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'audio', 'template')),
  content TEXT,
  media_url TEXT,
  wa_message_id TEXT,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  automation_type TEXT
);

-- Log de automações
CREATE TABLE automation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  triggered_by TEXT NOT NULL,
  entity_id UUID,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE mesversario_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mesversario_months ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Policy: apenas usuários autenticados acessam os dados
CREATE POLICY "Authenticated users only" ON customers FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users only" ON orders FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users only" ON order_items FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users only" ON payments FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users only" ON mesversario_contracts FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users only" ON mesversario_months FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users only" ON whatsapp_messages FOR ALL USING (auth.uid() IS NOT NULL);

-- Índices para performance
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_pickup ON orders(pickup_datetime);
CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_mp_id ON payments(mp_payment_id);
CREATE INDEX idx_mesversario_months_contract ON mesversario_months(contract_id);
CREATE INDEX idx_whatsapp_phone ON whatsapp_messages(phone);
CREATE INDEX idx_whatsapp_customer ON whatsapp_messages(customer_id);
```

---

## Seed SQL — Catálogo inicial

```sql
INSERT INTO products (name, category, base_price, description) VALUES
  ('Kit Magia', 'kit', 8000, 'Painel 50cm + 1 mini arco + balões + boleiras'),
  ('Kit Brilho', 'kit', 10999, 'Mesa 90x80 + painel + balões + LED'),
  ('Kit Brilho Luxo', 'kit', 17500, 'Kit Brilho + mesa exclusiva + elementos premium'),
  ('Kit Sonho', 'kit', 15000, 'Mesa fake branca + painel + balões + boleiras'),
  ('Kit Sonho Premium', 'kit', 25000, 'Arco 50cm + base acrílico + elementos premium'),
  ('Caixa Média', 'kit', 6000, 'Composição com 1 caixa personalizada'),
  ('Caixa Grande', 'kit', 8000, 'Composição com 1 caixa grande personalizada'),
  ('Caixa Grande com Bubble', 'kit', 13000, 'Caixa grande + balão bubble personalizado'),
  ('Arco Delivery Pequeno', 'kit', 8000, 'Arco de balões para montagem em casa'),
  ('Arco Delivery Médio', 'kit', 11000, 'Arco médio para montagem em casa'),
  ('Arco Delivery Grande', 'kit', 16000, 'Arco grande para montagem em casa'),
  ('Torre Maternidade', 'kit', 17999, 'Torre vertical de balões para maternidade'),
  ('Torre Happy', 'kit', 19999, 'Estrutura vertical com base orgânica'),
  ('Topo de Bolo', 'grafica', 2500, 'Topo personalizado com tema e nome'),
  ('Kit Etiquetas', 'grafica', 3500, 'Set de etiquetas personalizadas para lembrancinha'),
  ('Cardápio de Mesa', 'grafica', 2500, 'Cardápio personalizado plastificado'),
  ('Balão Foil Coração', 'avulso', 4480, 'Balão foil sem personalização'),
  ('Balão Látex Nº 9', 'avulso', 1085, 'Balão látex unitário'),
  ('Numeral LED 1 unidade', 'avulso', 3500, 'Numeral decorativo com LED'),
  ('Numeral LED 2 unidades', 'avulso', 4500, 'Dupla de numerais com LED'),
  ('Entrega + Montagem', 'servico', 4000, 'Serviço de entrega e montagem no local');
```

---

## Documentações externas relevantes

### Next.js 14 App Router
- Docs: https://nextjs.org/docs/app
- Server Actions: https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations
- Route Handlers: https://nextjs.org/docs/app/building-your-application/routing/route-handlers

### Supabase
- Auth helpers Next.js: https://supabase.com/docs/guides/auth/server-side/nextjs
- RLS Policies: https://supabase.com/docs/guides/database/postgres/row-level-security
- Realtime: https://supabase.com/docs/guides/realtime

### Mercado Pago (PIX webhook)
- Webhook eventos: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
- Evento relevante: `payment` com `status: approved`
- Validar assinatura: header `x-signature` com HMAC SHA256

### Evolution API
- Docs: https://doc.evolution-api.com
- Enviar mensagem: `POST /message/sendText/{instance}`
- Webhook inbound: configurar URL no painel da Evolution

### shadcn/ui
- Componentes usados: Button, Card, Badge, Input, Select, Dialog, Sheet, Tabs, Calendar, Form
- Instalação: `npx shadcn@latest add [component]`

### next-pwa
- Package: `@ducanh2912/next-pwa`
- Config em `next.config.ts`

---

## Padrões de implementação

### Server Action de criação de pedido
```typescript
// app/actions/orders.ts
'use server'
import { createServerClient } from '@/lib/supabase/server'
import { sendOrderConfirmation } from '@/lib/whatsapp/automations'

export async function createOrder(data: CreateOrderInput) {
  const supabase = createServerClient()

  // 1. Criar pedido
  const { data: order, error } = await supabase
    .from('orders')
    .insert({ ...data })
    .select()
    .single()

  if (error) throw error

  // 2. Criar itens
  await supabase.from('order_items').insert(
    data.items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      unit_price_override: item.unit_price_override ?? null,
      notes: item.notes
    }))
  )

  return order
}
```

### Webhook Mercado Pago
```typescript
// app/api/webhooks/mercadopago/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { processPaymentWebhook } from '@/lib/mercadopago/webhooks'

export async function POST(req: NextRequest) {
  const body = await req.json()

  if (body.type === 'payment') {
    await processPaymentWebhook(body.data.id)
  }

  return NextResponse.json({ ok: true })
}
```

### Automação de WhatsApp ao mudar status
```typescript
// lib/whatsapp/automations.ts
export async function onOrderStatusChange(
  orderId: string,
  newStatus: OrderStatus,
  customer: Customer
) {
  switch (newStatus) {
    case 'em_producao':
      await sendWhatsApp(customer.phone, WA_MESSAGES.production_started(customer.full_name))
      break
    case 'pronto':
      await sendWhatsApp(customer.phone, WA_MESSAGES.kit_ready(customer.full_name, pickupTime))
      break
    case 'entregue':
      await sendWhatsApp(customer.phone, WA_MESSAGES.delivery_thanks(customer.full_name, googleLink))
      break
  }
}
```

### Criação automática dos 12 mêsversários
```typescript
// app/actions/mesversario.ts
export async function createContract(data: CreateContractInput) {
  const supabase = createServerClient()

  // 1. Criar contrato
  const { data: contract } = await supabase
    .from('mesversario_contracts')
    .insert(data)
    .select()
    .single()

  // 2. Gerar os 12 meses automaticamente
  const months = Array.from({ length: 12 }, (_, i) => ({
    contract_id: contract.id,
    month_number: i + 1,
    scheduled_date: addMonths(new Date(data.start_date), i).toISOString(),
    status: 'agendado'
  }))

  await supabase.from('mesversario_months').insert(months)

  return contract
}
```

---

## Critério de conclusão da Fase 1

✅ Flávio e Joane conseguem criar pedido completo com múltiplos itens
✅ Pagamento de sinal registrado manualmente (antes do webhook MP)
✅ Webhook MP recebe PIX → atualiza pedido → WhatsApp automático
✅ Filho vê checklist → marca pronto → WhatsApp automático
✅ Entrega confirmada → WhatsApp de agradecimento + Google Review
✅ Mêsversário criado → 12 meses gerados automaticamente
✅ PWA instalável no celular de Flávio e Joane
✅ Login funciona para os 2 usuários com roles diferentes
✅ Dashboard mostra KPIs básicos em tempo real

---

*PRD.md · Buum OS · Fase 1 · Maio 2026*
