# Configuração do banco com Prisma

1. Crie um arquivo `.env` local dentro de `ppw_server`.
2. Preencha `DATABASE_URL` com as credenciais do PostgreSQL do projeto.
3. Instale as dependências: `npm install`.
4. Prepare o banco e o cliente com `npm run db:setup`.
5. Confira as regras com `npm test -- --runInBand` e `npm run test:postgres`.
6. Inicie a API: `npm run dev`.

O `PrismaService` usa `PrismaPg`, seguindo o padrão do server de referência. O schema PostgreSQL configurado para este projeto é `bi3041468`.

Modelos criados: `Conta`, `Usuario`, `Espaco` e `Reserva`. `Conta` identifica quem faz login. `Usuario` representa a pessoa cadastrada pela conta para receber reservas. Pessoas, espaços e reservas têm `contaId`. Chaves estrangeiras compostas impedem relacionar uma reserva a uma pessoa ou sala de outra conta.

O schema também define `CredencialUsuario`, `SessaoUsuario` e `HistoricoReserva`. Depois de atualizar o schema, execute `npm run db:setup`. O comando executa `prisma db push`, `prisma generate` e `npm run db:constraints`. Essa última etapa aplica checks, a exclusão de horários sobrepostos e o trigger de histórico imutável a partir de `prisma/constraints.sql`. Execute o comando novamente quando precisar sincronizar a estrutura. Dados antigos incompatíveis com as constraints exigem correção antes de concluir a preparação.

O projeto usa sincronização com `db push`. O arquivo incremental antigo em `prisma/migrations` não constitui um histórico completo para criar o banco vazio com `migrate deploy`.

O cadastro em `/auth/registrar` cria uma conta com papel `ADMIN` para administrar os próprios cadastros. Esse papel fica sujeito ao isolamento por conta em todas as consultas e operações. O login em `/auth/login` estabelece uma sessão de 12 horas em cookie `HttpOnly`, e `/auth/logout` revoga a sessão. Senhas são armazenadas com scrypt e salt aleatório. O banco guarda somente o hash do token da sessão. As pessoas cadastradas em `/usuarios` pertencem à conta autenticada e não recebem credenciais de login.

Os papéis `OPERADOR` e `CLIENTE` continuam disponíveis para limitar ações. Para alterar o papel de uma conta, um administrador do banco pode usar o e-mail de acesso:

```sql
UPDATE "bi3041468"."contas"
SET "papel" = 'OPERADOR'
WHERE "id" = (
  SELECT "conta_id"
  FROM "bi3041468"."credenciais_usuarios"
  WHERE "email" = lower('operador@exemplo.com')
);
```

## Regras de reserva e permissões

| Ação | Estado de origem | Estado de destino | Quem pode executar |
| --- | --- | --- | --- |
| CONFIRMAR | PENDENTE | CONFIRMADA | OPERADOR e ADMIN |
| INICIAR | CONFIRMADA | EM_ANDAMENTO | OPERADOR e ADMIN |
| FINALIZAR | EM_ANDAMENTO | FINALIZADA | OPERADOR e ADMIN |
| CANCELAR | PENDENTE ou CONFIRMADA | CANCELADA | Conta dona da reserva, conforme seu papel |

O check-in exige que o horário de início tenha chegado e que o período reservado ainda não tenha terminado. O projeto considera as reservas no horário de Brasília, UTC−03. Outra reserva da mesma sala em andamento impede o check-in até seu checkout, inclusive quando os agendamentos são de dias diferentes. Reservas finalizadas e canceladas não têm transições de saída. Reservas em andamento devem seguir para finalização. A edição de dados é permitida em reservas pendentes, sujeita à propriedade e ao papel do usuário.

As transições são recebidas em `POST /reservas/:id/acoes`, com `acao`, `justificativa` e `updatedAtEsperado`. O autor é obtido da sessão. `PATCH /reservas/:id` recebe `updatedAtEsperado` e os dados de agendamento, e campos fora do DTO provocam HTTP 400. Cancelar libera o horário e mantém a reserva e seu histórico. O fluxo não possui pagamento ou saldo para estornar.

## Arquitetura e integridade

Contas, pessoas, credenciais, sessões, espaços, reservas e histórico ficam em tabelas próprias. Credenciais têm relação 1:1 com a conta e e-mail único. A conta pode criar várias pessoas e salas, e agendar uma sala para qualquer pessoa do seu cadastro. Cada linha do histórico referencia sua reserva e a conta autora. A exclusão de registros referenciados pelo histórico é restrita.

Listagens e operações por ID filtram sempre pela conta obtida da sessão. O cliente não pode escolher `contaId` no corpo da requisição. Uma conta nova começa sem pessoas, salas e reservas. Ao trocar de conta, os dados são carregados novamente do backend. O isolamento vale também para contas com papel `ADMIN`.

A matriz de estados e as guardas ficam no domínio, separadas de HTTP e persistência. A camada de aplicação trata autorização e traduz erros de domínio para HTTP. O provider `reservaGuardasProvider` registra implementações de `GuardaTransicaoReserva`. Novas guardas podem ser adicionadas à composição sem alterar o executor de transições. Os repositórios Prisma e em memória seguem o contrato de reserva, incluindo conflito, controle de versão e histórico. Essa divisão aplica SRP e OCP. O mesmo teste de contrato é executado contra as duas implementações para verificar LSP.

No PostgreSQL, a reserva e seu histórico inicial são inseridos na mesma transação. Uma mudança de estado e seu histórico também compartilham a transação. Falhas na auditoria provocam rollback. Edições e transições usam bloqueio por reserva e verificam a versão `updatedAt`. Criações e reagendamentos usam bloqueio por espaço/data. Uma constraint de exclusão GiST impede sobreposição de reservas ativas no banco. Intervalos usam limite final aberto, permitindo uma reserva começar quando outra termina. Check-in e checkout usam também um bloqueio por sala. Um índice único parcial permite somente uma reserva `EM_ANDAMENTO` por sala, protegendo a ocupação real no banco.

## Verificação

`npm test -- --runInBand` executa as regras de negócio, o contrato em memória e as rotas HTTP com sessão controlada nos testes. `npm run test:postgres` gera um cliente Prisma com os mesmos modelos e mapeamentos para tabelas de teste com prefixo aleatório `v_`. O teste instancia o `ReservaPrismaRepository` da aplicação e executa o mesmo contrato usado em memória, sem simular suas consultas ou transações. As tabelas usam o schema `bi3041468` e os enums existentes. O cliente gerado, as tabelas e a função de teste são removidos ao terminar. Prepare o banco antes de executar e utilize uma conta com permissão para criar tabelas no schema.

Os testes PostgreSQL cobrem criações e check-ins concorrentes, horários adjacentes, liberação da sala após checkout, rollback por falha de auditoria durante criação e transição, integridade referencial e imutabilidade do histórico. Os testes HTTP cobrem 401 sem sessão, 403 por papel, 404 por isolamento de conta e 400 por campos desconhecidos, nulos e datas ou horários inválidos. Há um caso específico que consulta o histórico quando o ID da pessoa agendada difere do ID da conta autenticada.

## Atualizacao: concorrencia e auditoria completa

Antes de iniciar a API atualizada, execute npm run db:setup. O setup e aditivo: os campos novos de historico sao opcionais para preservar eventos antigos, e as colunas legadas de excedentes permanecem no banco. Nao use reset nem opcoes de aceitar perda de dados. O trigger de estados verifica novas escritas, sem reescrever reservas antigas.

O cliente deve enviar o updatedAt da reserva que esta exibindo como updatedAtEsperado, tanto no PATCH quanto nas acoes. Versao ausente ou invalida retorna 400; versao antiga retorna 409. A tela recarrega a reserva em conflito e exige revisao antes de outra tentativa. Nao existe reenvio automatico. A API antiga sem versao deixa de ser compativel.

O historico informa tipoEvento (CRIACAO, EDICAO ou TRANSICAO). Edicoes armazenam dadosAnteriores e dadosNovos do agendamento, autor e timestamp na mesma transacao. Alteracoes sem diferenca nao mudam a versao nem geram evento. Eventos legados sao classificados na leitura; nao ha inventario retroativo de valores que nunca foram registrados.

Check-in revalida as guardas depois de adquirir os locks. Horarios reais sao gerados pelo repositorio no momento da gravacao. O PostgreSQL tambem rejeita transicoes ilegais, alteracoes de agendamento fora de PENDENTE e inconsistencias de check-in/checkout. A geracao do historico continua sendo responsabilidade das transacoes da aplicacao; scripts administrativos precisam seguir o mesmo contrato.

Nao ha cobranca de excedentes. Os campos de excedentes foram retirados do contrato ativo, mas suas colunas ficam preservadas. Cada cadastro cria explicitamente ADMIN da propria conta, sem acesso global ou agenda compartilhada.

Configure NEXT_PUBLIC_API_URL no frontend e CORS_ORIGINS no backend (origens separadas por virgula). Os exemplos estao em .env.example e nao contem credenciais reais. Padroes locais: API http://localhost:8000 e frontend http://localhost:3000. A URL publica do frontend e incorporada no build.

Execute npm run db:check para verificar tabelas, campos de auditoria, constraints, indice e triggers ativos. O teste PostgreSQL tambem cobre edicoes concorrentes e rollback de edicao quando o historico falha.
