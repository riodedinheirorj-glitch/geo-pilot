
# Redesign da Tela de Login - "Rotasmart Motorista"

Vou recriar completamente o componente `LoginScreen.tsx` com o visual premium, light mode, inspirado na imagem de referencia enviada.

## O que sera feito

### Visual e Layout
- Fundo com gradiente branco para azul muito claro
- Elementos graficos SVG no fundo simulando rede de rotas/conexoes (linhas e pontos sutis)
- Card central flutuante branco com efeito glass discreto, sombra suave, bordas arredondadas (20px)
- Largura maxima do card: 420px
- Centralizado vertical e horizontalmente

### Topo
- Icone de pin com gradiente azul para roxo (criado em SVG inline)
- "Rotasmart" em azul escuro, bold
- "Motorista" em azul mais claro, peso normal
- Logo e texto lado a lado, centralizados
- Texto descritivo abaixo em cinza medio

### Abas (Entrar / Cadastrar)
- Container com fundo cinza claro arredondado
- Aba ativa: fundo branco, sombra interna, texto azul
- Aba inativa: sem fundo, texto cinza
- Transicao suave

### Formulario - Aba "Entrar"
- Campo E-mail com label, borda cinza clara, foco azul
- Campo Senha com toggle de visibilidade (icone olho)
- Link "Esqueceu sua senha?" alinhado a direita
- Botao "Entrar" com gradiente azul medio para azul vibrante, sombra, hover com elevacao

### Formulario - Aba "Cadastrar"
- Campos: Nome completo, Telefone (formatado), CPF (formatado), E-mail, Senha
- Mesmos padroes visuais
- Botao "Criar conta"

### Validacao
- Campos obrigatorios - botao desabilitado se vazios
- Validacao de email (formato)
- Validacao de CPF (11 digitos)
- Validacao de telefone (10-11 digitos)
- Erro elegante abaixo do input invalido

## Detalhes Tecnicos

### Arquivo modificado
- `src/components/LoginScreen.tsx` - reescrita completa

### Abordagem
- CSS inline e classes Tailwind para o visual premium
- SVG inline para o icone do pin e para o fundo com rede de rotas
- Formatadores de CPF e telefone mantidos
- Estado de erros por campo com mensagens visuais
- Botao desabilitado quando campos obrigatorios estao vazios
- Sem dependencias novas necessarias
