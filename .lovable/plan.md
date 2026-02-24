

## Sistema de Assinatura Mensal - R$ 34,99 via PIX

### Resumo

Criar uma tela completa de assinatura mensal onde o motorista pode assinar o plano de R$ 34,99/mes via PIX, com QR Code para pagamento. O sistema verificara se a assinatura esta ativa antes de permitir o uso de funcionalidades premium.

---

### Componentes a criar

**1. Tela de Assinatura (`src/components/Subscription.tsx`)**
- Card com detalhes do plano (nome, preco R$ 34,99, beneficios)
- Lista de beneficios inclusos (rotas ilimitadas, otimizacao, suporte, etc.)
- Botao "ASSINAR AGORA" que abre o fluxo de pagamento PIX
- Indicador de status da assinatura (ativa/expirada/sem assinatura)
- Se ja assinante, mostrar data de expiracao e badge "ATIVO"

**2. Modal de Pagamento PIX (`src/components/PixPaymentModal.tsx`)**
- QR Code PIX gerado (inicialmente simulado com dados estaticos)
- Codigo "copia e cola" do PIX
- Timer de expiracao do QR Code (15 minutos)
- Botao "Copiar codigo PIX"
- Polling simulado para verificar pagamento (botao "Ja paguei" por enquanto)
- Animacao de sucesso ao confirmar pagamento

---

### Alteracoes em arquivos existentes

**`src/pages/Index.tsx`**
- Adicionar "subscription" ao tipo `Screen`
- Importar e renderizar o componente `Subscription`

**`src/components/BottomNav.tsx`**
- Nenhuma alteracao (acesso via perfil ou dashboard)

**`src/components/Profile.tsx`**
- Adicionar item de menu "Assinatura" com icone de coroa/estrela
- Mostrar badge de status (Ativo/Inativo)
- Navegar para tela de assinatura ao clicar

**`src/components/Dashboard.tsx`**
- Adicionar banner no topo quando assinatura esta inativa/expirada
- Banner com CTA "Assine agora" que leva a tela de assinatura

---

### Fluxo do usuario

```text
Perfil -> Assinatura -> Ver plano -> Assinar Agora
  -> Modal PIX (QR Code + codigo copia/cola)
  -> Confirmar pagamento -> Assinatura ativa por 30 dias
```

---

### Detalhes tecnicos

- O banco ja possui `user_wallets.subscription_expires_at` para controlar a validade
- O QR Code PIX sera inicialmente simulado (imagem estatica + codigo mock)
- Para integracao real futura, sera necessario criar uma Edge Function com um gateway de pagamento (ex: EfiPay, Mercado Pago) que gera o QR Code PIX dinamicamente
- A verificacao de assinatura ativa sera feita comparando `subscription_expires_at` com a data atual
- Ao "confirmar" pagamento, o sistema atualiza `subscription_expires_at` para `now() + 30 dias`
- Componente usa o mesmo design system do app (cards arredondados, gradients, sombras)

