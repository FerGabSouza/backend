"""
Backend do projeto bar-system

Este README fornece uma visão completa do backend (NestJS + Prisma + PostgreSQL): setup, arquitetura, módulos, scripts e boas práticas.

Requisitos
- Node.js 18+ (recomendado)
- npm
- Docker (recomendado para Postgres) ou PostgreSQL local

Início rápido (PowerShell)
1) Subir o Postgres (raiz do repositório):
```powershell
cd 'C:\Users\User\Documents\Projetos\bar-system'
docker-compose up -d
```

2) Instalar dependências e rodar em modo dev:
```powershell
cd backend
npm install
npm run start:dev
```

3) Endpoints: http://localhost:3000

Variáveis de ambiente
- `backend/.env` — DATABASE_URL usada em runtime
- `backend/.env.test` — DATABASE_URL para testes (E2E)

Banco de dados (Prisma)
- Schema: `backend/prisma/schema.prisma` (modelos: Category, Product, PaymentMethod, Machine, MachineFee, Sale, SaleItem, SalePayment, Expense, enums)
- Criar / aplicar migrations:
```powershell
cd backend
npx prisma migrate dev --name init      # criar em dev
npx prisma migrate deploy               # aplicar em produção/teste
npx prisma generate                      # gerar client
```

Prisma Studio (UI):
```powershell
npx prisma studio
```

Visão geral dos módulos (o que cada um faz)

- `src/prisma`
  - `PrismaModule` / `PrismaService`: encapsula o `PrismaClient`. Liga/desliga conexão com o banco, usado por todos os serviços.

- `src/categories`
  - Responsabilidade: CRUD de categorias
  - Controller expõe rotas REST; Service contém regras de negócio (validação, tratamento de erro de unique). DTOs validam entrada.

- `src/products`
  - Responsabilidade: CRUD de produtos, relacionamento com `Category`.
  - Campos importantes: `salePrice`, `costPrice`, `isStockTracked`, `stockQuantity`.

- `src/machines`
  - Responsabilidade: gerenciar maquininhas e `MachineFee` (taxas por marca/pagamento).

- `src/payment-methods`
  - Responsabilidade: gerenciar formas de pagamento (PIX, DINHEIRO, CREDITO, etc.).

- `src/sales`
  - Responsabilidade: criar vendas complexas com itens e pagamentos.
  - Principais pontos:
    - Validação de itens e estoque
    - Agregação de itens por produto
    - Cálculo de taxas e `netAmount` por pagamento
    - Criação de `Sale`, `SaleItem` e `SalePayment` dentro de `prisma.$transaction`
    - Cancelamento: estorna estoque e marca venda como cancelada

- `test` e utilitários
  - `test/utils/reset-database.ts`: helper que limpa tabelas entre testes
  - `test/utils/test-app.ts`: inicializa a aplicação Nest para E2E

Scripts úteis (em `backend/package.json`)
- `npm run start:dev` - iniciar em modo desenvolvimento (watch)
- `npm run build` - compilar
- `npm run start:prod` - executar build
- `npm run lint` - ESLint + Prettier (aplica --fix)
- `npm run test` - Jest unit tests
- `npm run test:e2e` - Jest e2e

Dicas e troubleshooting
- `ETARGET` no npm: versão inexistente no registry. Use `npm view <pkg> versions --json` para checar e ajuste `package.json`.
- Prisma: se migrations falharem, verifique `DATABASE_URL` e se o banco existe. Para testes, crie o DB apontado em `.env.test`.
- Lint: alguns avisos em testes sobre `no-unsafe-*` podem surgir devido a mocks; use `jest.Mocked<T>` ou relaxe regras apenas para arquivos de teste.

Boas práticas / próximos passos
- Tipar mocks nos testes (`jest.Mocked<PrismaService>`) para evitar `any` nos specs
- Integrar Swagger para documentar endpoints
- Adicionar CI que rode lint, build, migrate-test e testes
- Monitoramento (Sentry) e logs estruturados

Contribuindo
- Crie branches por feature/bugfix e garanta que `npm run lint` e `npm test` passem antes de abrir PR

Problemas? Abra um issue com as saídas de `npm install`, `npm audit`, `npm test` e eu te ajudo.

