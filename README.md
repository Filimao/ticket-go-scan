# 🎟️ TicketGo — Bilhetes e Gestão de Eventos em Moçambique

Plataforma web para criar eventos, vender bilhetes digitais e controlar as entradas com validação por QR Code. Liga organizadores e participantes numa experiência simples, pensada para o mercado moçambicano.

🔗 **Demo online:** [ticket-go-scan.vercel.app](https://ticket-go-scan.vercel.app)


## 🎯 Objetivo

Reduzir a dependência de processos manuais na venda e no controlo de bilhetes, acompanhando o participante desde a descoberta do evento até à entrada no recinto.

## ✨ Funcionalidades

**Eventos e bilhetes**
- Criação e publicação de eventos com datas, locais, imagens e preços.
- Diferentes categorias de bilhetes e gestão de disponibilidade.
- Página para descobrir e consultar eventos.

**Bilhetes digitais e check-in**
- Geração de bilhetes com QR Code.
- Leitura do QR Code pela câmara para validar a entrada.
- Validação no servidor, para impedir que um bilhete já usado seja aceite outra vez.

**Painel do organizador**
- Gestão dos eventos publicados.
- Acompanhamento das vendas e dos bilhetes emitidos, com estatísticas e gráficos.

**Utilizadores e permissões**
- Registo e autenticação.
- Papéis separados para participantes, organizadores e administradores, com controlo de acesso.

**Pagamentos**
- Arquitetura preparada para pagamentos eletrónicos, incluindo M-Pesa e e-Mola. A integração está em desenvolvimento.

**Interface**
- Design responsivo para telemóvel, tablet e computador.

## 🛠️ Tecnologias

| Área | Ferramentas |
|------|-------------|
| Interface | React, TypeScript, Tailwind CSS, shadcn/ui (Radix UI) |
| Aplicação | TanStack Start, TanStack Router, TanStack Query |
| Backend e dados | Supabase (autenticação, PostgreSQL, regras de acesso RLS) |
| QR Code | `qrcode` (geração) e `html5-qrcode` (leitura pela câmara) |
| Formulários e gráficos | React Hook Form, Zod, Recharts |
| Publicação | Vercel |

## 🚀 Como correr localmente

Requisitos: Node.js 18+ (ou Bun) e um projeto no [Supabase](https://supabase.com).

```bash
# 1. Clonar o repositório
git clone https://github.com/Filimao/ticket-go-scan.git
cd ticket-go-scan

# 2. Instalar as dependências
npm install

# 3. Criar o ficheiro .env na raiz do projeto (veja abaixo)

# 4. Iniciar em modo de desenvolvimento
npm run dev
```

Variáveis de ambiente do ficheiro `.env`:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_PROJECT_ID=
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_PROJECT_ID=
```

> O ficheiro `.env` não deve ser enviado para o GitHub. Use apenas a chave pública (publishable / `anon`) do Supabase e nunca coloque chaves secretas no código do cliente.

Outros comandos:

```bash
npm run build    # gerar a versão de produção
npm run preview  # pré-visualizar a versão de produção
npm run lint     # verificar o código
npm run format   # formatar o código
```

## 🔐 Segurança

- Autenticação de utilizadores e controlo de acesso por papel.
- Validação dos bilhetes no servidor.
- Operações administrativas protegidas.
- Regras de acesso (RLS) no Supabase para proteger os dados.

## 📌 Estado do projeto

Em desenvolvimento. As funcionalidades disponíveis dependem da versão publicada e das integrações configuradas.

Ideias para as próximas versões:

- Aplicação móvel para Android e iOS.
- Notificações de confirmação e lembretes de eventos.
- Mais métodos de pagamento.
- Relatórios avançados para organizadores.
- Promoções, descontos e códigos de campanha.
- Análise de entradas em tempo real.

## ⚠️ Aviso

O TicketGo é uma plataforma independente de gestão de eventos. A venda de bilhetes e os pagamentos dependem das integrações e dos serviços configurados no projeto.

## 👤 Autor

**Filimão Feliz Mondlane** — Full-Stack Developer, Maputo, Moçambique
[GitHub](https://github.com/Filimao) · [LinkedIn](https://linkedin.com/in/filimaomondlane)
