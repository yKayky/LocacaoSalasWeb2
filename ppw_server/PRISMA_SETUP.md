# Configuração do banco com Prisma

1. Copie `.env.example` para `.env`.
2. Preencha `DATABASE_URL` com as credenciais do PostgreSQL do projeto.
3. Instale as dependências: `npm install`.
4. Gere o Prisma Client: `npx prisma generate`.
5. Crie/atualize as tabelas no schema configurado: `npx prisma db push`.
6. Inicie a API: `npm run dev`.

O `PrismaService` usa `PrismaPg`, seguindo o padrão do server de referência. O schema PostgreSQL configurado para este projeto é `bi3041468`.

Modelos criados: `Usuario`, `Espaco` e `Reserva`. As reservas possuem chaves estrangeiras para usuários e espaços.
