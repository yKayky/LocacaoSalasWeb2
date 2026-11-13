# CoworkSpace — Locação de salas

Sistema para cadastrar pessoas e salas e gerenciar reservas, com transições de estado restritas, proteção contra conflitos de horário e trilha de auditoria. Cada conta administra seus próprios dados.

O frontend usa Next.js e React; o backend usa NestJS, Prisma e PostgreSQL. As instruções abaixo utilizam os scripts npm do projeto.

## Diagrama Entidade-Relacionamento (DER)

```mermaid
erDiagram
    Conta ||--o{ Usuario : cadastra
    Conta ||--o{ Espaco : possui
    Conta ||--o{ Reserva : gerencia
    Conta ||--o| CredencialUsuario : autentica
    Conta ||--o{ SessaoUsuario : abre
    Conta o|--o{ HistoricoReserva : autor
    Usuario ||--o{ Reserva : recebe
    Espaco ||--o{ Reserva : recebe
    Reserva ||--o{ HistoricoReserva : registra

    Conta {
        int id PK
        string nome
        PapelUsuario papel
    }
    Usuario {
        int id PK
        int contaId FK
        string nome
    }
    Espaco {
        int id PK
        int contaId FK
        string nome
        string descricao
        int capacidade
        string localizacao
        decimal valorPorHora
    }
    Reserva {
        int id PK
        int contaId FK
        int usuarioId FK
        int espacoId FK
        date data
        string horarioInicio
        string horarioFim
        StatusReserva status
        datetime createdAt
        datetime updatedAt
        datetime checkInReal "Opcional"
        datetime checkOutReal "Opcional"
        int tempoExcedenteMinutos "Legado, sem uso ativo"
        decimal valorExcedente "Legado, sem uso ativo"
    }
    HistoricoReserva {
        int idRegistro PK
        int reservaId FK
        TipoEventoReserva tipoEvento "Opcional para eventos legados"
        json dadosAnteriores "Opcional"
        json dadosNovos "Opcional"
        StatusReserva estadoAnterior "Opcional na criacao"
        StatusReserva novoEstado
        int autorId FK "Opcional no schema"
        string justificativa
        datetime timestamp
    }
    CredencialUsuario {
        int contaId PK, FK
        string email UK
        string senhaHash
    }
    SessaoUsuario {
        int id PK
        int contaId FK
        string tokenHash UK
        datetime expiraEm
        datetime criadaEm
    }
```

`Conta` identifica o login; `Usuario` representa uma pessoa cadastrada para receber reservas e não possui login próprio. As referências compostas de reserva para pessoa e espaço incluem `contaId`, impedindo vínculos entre contas diferentes. `PK` identifica chave primária, `FK` chave estrangeira e `UK` valor único.

`HistoricoReserva` registra criação, edição e transição (`CRIACAO`, `EDICAO`, `TRANSICAO`). Edições guardam os valores anteriores e novos na mesma transação da reserva. O histórico é protegido contra alteração e exclusão. Os campos de excedentes permanecem no banco somente para preservar dados antigos; não há cobrança de excedentes.

## Diagrama simplificado de estados

```mermaid
stateDiagram-v2
    [*] --> PENDENTE: Cadastrar
    PENDENTE --> CONFIRMADA: CONFIRMAR
    CONFIRMADA --> EM_ANDAMENTO: INICIAR (check-in)
    EM_ANDAMENTO --> FINALIZADA: FINALIZAR (check-out)
    PENDENTE --> CANCELADA: CANCELAR
    CONFIRMADA --> CANCELADA: CANCELAR
    FINALIZADA --> [*]
    CANCELADA --> [*]
```

Somente reservas pendentes podem ter seus dados editados. Confirmar, iniciar e finalizar exigem papel `ADMIN` ou `OPERADOR` da própria conta. O cancelamento é permitido à conta proprietária nos estados indicados. O check-in deve ocorrer dentro do período reservado e exige que a sala esteja livre. `FINALIZADA` e `CANCELADA` não possuem transições de saída.

Edições e ações exigem `updatedAtEsperado`, correspondente à versão exibida ao usuário. Uma versão antiga retorna HTTP 409; a interface atualiza os dados para revisão. Reservas não são excluídas pelo fluxo da aplicação: utiliza-se o cancelamento para preservar a auditoria.

## Como executar localmente

**Pré-requisitos:** Node.js 22 LTS ou 24 LTS, npm e uma instância PostgreSQL acessível. Execute os comandos em PowerShell, a partir da pasta do projeto. Reserve as portas **3000** (frontend), **8000** (API) e a porta configurada para o PostgreSQL (normalmente **5432**).

### 1. Preparar o banco

Conecte-se ao PostgreSQL pelo pgAdmin ou psql e execute:

```sql
CREATE DATABASE coworkspace;
```

Conecte-se ao banco `coworkspace` e execute:

```sql
CREATE SCHEMA IF NOT EXISTS bi3041468;
```

### 2. Configurar o ambiente

Na raiz do projeto, copie os exemplos de configuração. Se os arquivos de destino já existirem, ajuste-os sem sobrescrever suas configurações:

```powershell
Copy-Item ppw_server/.env.example ppw_server/.env
Copy-Item ppw_client/.env.example ppw_client/.env.local
```

Configure `ppw_server/.env` **antes de instalar as dependências**; a instalação gera o cliente Prisma e precisa de `DATABASE_URL`:

```dotenv
DATABASE_URL="postgresql://postgres:SUA_SENHA_LOCAL@localhost:5432/coworkspace?schema=bi3041468"
CORS_ORIGINS=http://localhost:3000
```

Ajuste usuário, senha, host, porta e nome do banco conforme seu PostgreSQL. Caracteres especiais na senha devem ser codificados para URL. Mantenha o schema `bi3041468` e use um usuário com permissão para criar tabelas, índices, funções e triggers nesse schema. Arquivos `.env` não devem ser enviados ao Git.

Em `ppw_client/.env.local`, mantenha:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Se mudar a origem do frontend, ajuste `CORS_ORIGINS` no backend; múltiplas origens são separadas por vírgula. Reinicie os processos depois de alterar variáveis de ambiente. A URL pública da API também é incorporada ao build do frontend.

### 3. Iniciar o backend

No primeiro terminal, a partir da raiz do projeto:

```powershell
cd ppw_server
npm ci
npm run db:setup
npm run dev
```

O comando `db:setup` sincroniza as tabelas, gera o cliente Prisma, aplica as constraints e verifica as proteções do banco. O processo suportado utiliza `db push` e SQL complementar; o arquivo antigo em `prisma/migrations` não é um histórico completo para `migrate deploy`. A API fica em **http://localhost:8000**.

### 4. Iniciar o frontend

Em outro terminal, a partir da raiz do projeto:

```powershell
cd ppw_client
npm ci
npm run dev
```

Acesse **http://localhost:3000** e crie sua conta para começar. O cadastro cria um administrador da própria conta. Cadastre uma pessoa em **Usuários**, uma sala em **Espaços** e depois uma reserva. Use o detalhe da reserva para acompanhar os estados e o histórico.

Mantenha os dois terminais abertos. Para encerrar o ambiente, pressione `Ctrl+C` em cada terminal.

## Verificação e atualizações

No diretório `ppw_server`:

```powershell
npm run db:check
npm test -- --runInBand
npm run test:postgres
npm run build
```

`db:check` confere a estrutura e as proteções SQL. Os testes PostgreSQL utilizam tabelas temporárias de teste com prefixo aleatório no schema do projeto e as removem ao terminar; exigem o banco preparado e permissões de criação de objetos. Eles verificam concorrência, isolamento, ocupação exclusiva, rollback e auditoria imutável.

No diretório `ppw_client`:

```powershell
npm run lint
npm run build
```

Depois de atualizar o projeto, execute novamente `npm ci` nos diretórios cujas dependências mudaram e `npm run db:setup` no backend antes de iniciar a API. Não execute reset nem aceite perda de dados para resolver incompatibilidades de registros existentes.

| Problema | O que verificar |
| --- | --- |
| Conexão com o banco expirou | Serviço PostgreSQL, host, porta, VPN/rede e `DATABASE_URL`. |
| Campos ou triggers ausentes | Execute `npm run db:setup` em `ppw_server`. |
| Frontend não acessa a API | Backend na porta 8000, `NEXT_PUBLIC_API_URL` e origem em `CORS_ORIGINS`. |
| Porta ocupada | Encerre a instância anterior; se alterar a porta do frontend, ajuste o CORS. |
| Check-in recusado | Horário de Brasília dentro da reserva, estado `CONFIRMADA` e ausência de outra reserva em andamento na sala. |

Consulte [a configuração detalhada do banco](ppw_server/PRISMA_SETUP.md) e [o relatório de revisão](docs/revisao-projeto.md).
