
## 1. Máquina de Estados Finita e Transições Restritas

**Pergunta:** Estou fazendo um sistema de reserva de salas e preciso usar uma máquina de estados finita, mas não entendi direito o que ela é. Pode explicar com palavras simples e mostrar um exemplo em TypeScript usando uma reserva? Quero que explique o código por partes, porque ainda estou aprendendo.

**A Resposta Bruta da IA:** Uma máquina de estados organiza um processo com um número limitado de situações. A reserva ocupa uma situação por vez; uma ação só permite certos destinos.

```ts
type Estado = 'PENDENTE' | 'CONFIRMADA';
function confirmar(atual: Estado): Estado {
  if (atual !== 'PENDENTE') throw new Error('Confirmação inválida.');
  return 'CONFIRMADA';
}
```

`Estado` limita os valores na compilação. O parâmetro recebe a situação atual. O `if` bloqueia uma origem inadequada. O retorno informa a próxima situação, mas não salva o banco sozinho.

**A Crítica e Refatoração do Aluno:** Esse exemplo me ajudou a entender a ideia inicial: uma reserva só pode mudar de PENDENTE para CONFIRMADA quando a ação for permitida. Só que ele ainda é bem simples, porque não salva a alteração no banco e não verifica quem está fazendo isso. Para o meu sistema, preciso trabalhar com todos os estados e fazer essas verificações no backend.


**Pergunta:** No meu projeto, uma reserva pode ficar pendente, confirmada, em andamento, finalizada ou cancelada. Como sei quais mudanças de status devo permitir? Pode montar um exemplo de código com esses estados e explicar por que uma reserva não deveria pular direto de pendente para finalizada?

**A Resposta Bruta da IA:** Escolha as mudanças conforme os acontecimentos reais: confirmar aprova, iniciar registra entrada e finalizar registra saída. Cancelar interrompe antes do uso.

```ts
type StatusReserva = 'PENDENTE' | 'CONFIRMADA' | 'EM_ANDAMENTO'
  | 'FINALIZADA' | 'CANCELADA';
const destinos: Record<StatusReserva, readonly StatusReserva[]> = {
  PENDENTE: ['CONFIRMADA', 'CANCELADA'],
  CONFIRMADA: ['EM_ANDAMENTO', 'CANCELADA'],
  EM_ANDAMENTO: ['FINALIZADA'], FINALIZADA: [], CANCELADA: [],
};
```

A chave é a origem; o array lista destinos legais. Uma pendente não deve terminar sem confirmação, check-in e checkout. Arrays vazios indicam estados terminais.

**A Crítica e Refatoração do Aluno:** Agora ficou mais fácil visualizar o caminho da reserva. Se ela está PENDENTE, não faz sentido aparecer como FINALIZADA sem ter sido confirmada e utilizada. A lista mostra quais mudanças podem acontecer, mas ainda quero ligar cada mudança a uma ação, como confirmar ou fazer check-in.


**Pergunta:** Se eu tirar a opção de trocar o status da tela, alguém ainda poderia mandar uma requisição para a API alterando esse campo? Como evito isso no NestJS? Quero um exemplo com DTO e validação e uma explicação do motivo de cada parte.

**A Resposta Bruta da IA:** Sim. Liste os campos editáveis e rejeite propriedades extras.

```ts
class UpdateReservaDto {
  @IsISO8601({ strict: true }) updatedAtEsperado!: string;
  @ValidateIf((_obj, valor) => valor !== undefined)
  @Matches(/^(?:[01]\d|2[0-3]):[0-5]\d$/)
  horarioInicio?: string;
  // status não pertence ao DTO.
}
app.useGlobalPipes(new ValidationPipe({
  whitelist: true, forbidNonWhitelisted: true, transform: true,
}));
```

Os decorators são de `class-validator`. `IsISO8601` valida o formato da versão; `ValidateIf` aceita omissão, mas valida `null`; `Matches` exige horário válido. `whitelist` identifica campos decorados e `forbidNonWhitelisted` rejeita os extras com 400. `transform` cria a instância do DTO, sem substituir validações.

**A Crítica e Refatoração do Aluno:** Eu achava que tirar o campo da tela já resolveria, mas entendi que alguém pode enviar uma requisição diretamente para a API. Por isso, não basta esconder o status no frontend: o backend precisa aceitar apenas os campos que realmente podem ser editados. No meu projeto, o status deve mudar por uma ação específica, não por uma edição comum.


**Pergunta:** Estou tentando entender como separar a edição normal da reserva das ações de confirmar, iniciar, finalizar e cancelar. Preciso criar uma rota para cada uma ou posso usar uma rota que recebe a ação? Mostre as duas ideias e um exemplo de implementação em NestJS, explicando qual é mais adequada para meu caso.

**A Resposta Bruta da IA:** Ambas funcionam. Rotas específicas explicitam a operação; uma rota de ações compartilha o fluxo.

```ts
// Alternativa: MotivoVersaoDto validaria justificativa e updatedAtEsperado.
@Post(':id/confirmar')
confirmar(@Param('id', ParseIntPipe) id: number,
  @Body() dto: MotivoVersaoDto, @CurrentUser() actor: AuthenticatedUser) {
  return this.transicionar.execute(id, 'CONFIRMAR', dto.justificativa,
    actor, dto.updatedAtEsperado);
}
// Opção atual: AcaoReservaDto valida também a ação.
@Post(':id/acoes')
acao(@Param('id', ParseIntPipe) id: number,
  @Body() dto: AcaoReservaDto, @CurrentUser() actor: AuthenticatedUser) {
  return this.transicionar.execute(id, dto.acao, dto.justificativa,
    actor, dto.updatedAtEsperado);
}
```

Os métodos pressupõem `AuthSessionGuard`. Na primeira opção, as outras ações teriam rotas semelhantes. A edição permanece em `PATCH /reservas/:id`.

**A Crítica e Refatoração do Aluno:** As duas opções de rota parecem possíveis, mas a rota única de ações ficou mais interessante para o meu sistema, porque todas as mudanças seguem o mesmo controle. Entendi também que a rota de edição da reserva deve continuar separada. Os nomes de classes do primeiro exemplo são só para mostrar a alternativa; não preciso colocar as duas no projeto.


**Pergunta:** Como posso fazer o backend verificar automaticamente se uma ação é permitida no estado atual da reserva, sem escrever vários ifs espalhados pelo projeto? Mostre um exemplo de código em TypeScript com uma tabela ou mapa de transições e explique como ele funciona.

**A Resposta Bruta da IA:** Centralize as combinações em um mapa, como no projeto:

```ts
type AcaoReserva = 'CONFIRMAR' | 'INICIAR' | 'FINALIZAR' | 'CANCELAR';
const transicoes: Record<AcaoReserva, Partial<Record<StatusReserva, StatusReserva>>> = {
  CONFIRMAR: { PENDENTE: 'CONFIRMADA' },
  INICIAR: { CONFIRMADA: 'EM_ANDAMENTO' },
  FINALIZAR: { EM_ANDAMENTO: 'FINALIZADA' },
  CANCELAR: { PENDENTE: 'CANCELADA', CONFIRMADA: 'CANCELADA' },
};
function resolver(atual: StatusReserva, acao: AcaoReserva): StatusReserva {
  const destino = transicoes[acao]?.[atual];
  if (!destino) throw new TransicaoReservaInvalida('Transição inválida.');
  return destino;
}
```

A primeira consulta seleciona a ação; a segunda procura a origem. `Partial` permite aceitar só algumas origens. Combinações ausentes são rejeitadas.

**A Crítica e Refatoração do Aluno:** Gostei da ideia de deixar as mudanças permitidas em um lugar só, em vez de criar vários `if` espalhados. Assim, quando o usuário pedir para FINALIZAR uma reserva PENDENTE, o sistema encontra que essa mudança não existe e bloqueia. Mas essa parte resolve apenas o status: ainda preciso verificar a permissão da conta e o horário da reserva.



**Pergunta:** Meu sistema pode ter contas diferentes cadastrando suas próprias salas e reservas. Como faço para impedir que uma conta altere a reserva de outra, mesmo que saiba o ID dela? Quero um exemplo em NestJS e Prisma e uma explicação de onde essa verificação deve acontecer.

**A Resposta Bruta da IA:** Filtre ID e conta autenticada em leituras e escritas.

```ts
const reserva = await prisma.reserva.findFirst({ where: { id, contaId: actor.id } });
if (!reserva) throw new NotFoundException('Reserva não encontrada.');
// Na transação, depois de lock e validação da versão:
await tx.reserva.updateMany({
  where: { id, contaId: actor.id, status: estadoEsperado },
  data: { status: destino },
});
```

A sessão fornece a identidade, a aplicação autoriza e o repositório restringe as consultas. O 404 evita revelar a existência de um registro inacessível.

**A Crítica e Refatoração do Aluno:** Aqui entendi que não posso confiar no ID da conta enviado pela própria pessoa. O sistema precisa usar a conta que está logada e verificar se aquela reserva pertence a ela. Isso é importante porque duas contas podem ter reservas diferentes, e saber o número de uma reserva não deveria dar acesso a ela.


**Pergunta:** Uma reserva confirmada não deveria poder iniciar a qualquer hora. Como faço para permitir o check-in somente dentro do período reservado? Mostre uma validação em TypeScript com datas e horários e explique os casos em que ela deve bloquear a operação.

**A Resposta Bruta da IA:** Use início inclusivo e fim exclusivo, com fuso explícito.

```ts
const inicio = new Date(`${reserva.data}T${reserva.horarioInicio}:00-03:00`);
const fim = new Date(`${reserva.data}T${reserva.horarioFim}:00-03:00`);
if (agora < inicio) throw new GuardaReservaViolada('Ainda não chegou o horário.');
if (agora >= fim) throw new GuardaReservaViolada('O período terminou.');
```

Para 09h–10h, 08h59 bloqueia, 09h permite e 10h bloqueia. DTOs garantem data e horário válidos; a FSM exige CONFIRMADA.

**A Crítica e Refatoração do Aluno:** Entendi que estar CONFIRMADA não significa que a reserva pode começar a qualquer momento. O código compara o horário atual com o começo e o fim do período reservado. Também percebi que preciso tomar cuidado com o fuso horário, para o sistema não liberar ou bloquear o check-in na hora errada.



**Pergunta:** Se alguém tentar finalizar uma reserva que ainda está pendente, qual erro a API deveria retornar? Pode mostrar um exemplo de tratamento desse erro no NestJS e explicar como a interface poderia exibir uma mensagem clara para o usuário?

**A Resposta Bruta da IA:** No contrato atual, ação incompatível retorna 400; conflito de versão retorna 409.

```ts
try {
  destino = resolverTransicao(reserva.status, acao);
} catch (erro) {
  if (erro instanceof TransicaoReservaInvalida) throw new BadRequestException(erro.message);
  throw erro;
}
// Frontend, após resposta não OK:
const corpo = await resposta.json();
setErro(Array.isArray(corpo.message) ? corpo.message.join(', ') : corpo.message);
```

A mensagem pode ser “Ação FINALIZAR não permitida no estado PENDENTE”. A tela mantém a reserva anterior. Falta de sessão retorna 401; papel insuficiente retorna 403.

**A Crítica e Refatoração do Aluno:** Antes eu pensava só em mostrar uma mensagem de erro, mas vi que existem situações diferentes. Tentar uma mudança de status proibida não é a mesma coisa que editar uma reserva que outra pessoa já alterou. Vou precisar tratar esses casos no backend e mostrar uma mensagem que ajude o usuário a entender o que aconteceu, sem exibir informações internas do banco.


**Pergunta:** Depois de implementar as regras de status, como verifico se estão funcionando de verdade? Quero exemplos de testes em Jest/NestJS para uma mudança permitida e outra proibida, explicando o que cada teste está verificando.

**A Resposta Bruta da IA:** Teste o destino permitido e a rejeição do proibido.

```ts
it('confirma uma pendente', () => {
  expect(resolverTransicao('PENDENTE', 'CONFIRMAR')).toBe('CONFIRMADA');
});
it('não finaliza uma pendente', () => {
  expect(() => resolverTransicao('PENDENTE', 'FINALIZAR'))
    .toThrow(TransicaoReservaInvalida);
});
```

O primeiro compara o destino; o segundo exige uma exceção. Testes HTTP ainda devem confirmar 400 ao enviar status no PATCH.

**A Crítica e Refatoração do Aluno:** Esses testes mostram a ideia de conferir um caso que deve funcionar e outro que deve falhar. Só que testar essas duas situações não garante todas as regras. Também preciso considerar outras combinações de estado e ação e testar a API, porque um botão desabilitado na tela não impede alguém de enviar uma requisição manualmente.


## 2. Regras de Negócio e Conflitos Assíncronos

**Pergunta:** Preciso implementar regras de negócio no meu sistema de locação de salas, mas ainda confundo isso com validações comuns de formulário. Qual é a diferença? Use exemplos de reservas e mostre um pequeno código em TypeScript, explicando por que essa regra precisa existir no backend.

**A Resposta Bruta da IA:** Validação de entrada confere formato, tipo e limites. Regra de negócio decide se uma operação faz sentido no processo: sala livre, edição só de pendentes e checkout após uso.

```ts
if (horarioInicio >= horarioFim) throw new BadRequestException('Fim deve ser posterior ao início.');
if (reserva.status !== 'PENDENTE') throw new BadRequestException('Somente pendentes são editáveis.');
```

A comparação de horários pressupõe HH:mm válido. A segunda regra depende do registro armazenado. O backend é obrigatório porque outros clientes podem ignorar o formulário.

**A Crítica e Refatoração do Aluno:** Consegui perceber melhor a diferença: uma validação pode conferir se o horário foi preenchido corretamente, enquanto uma regra de negócio decide se aquela reserva pode ser alterada. Mesmo que eu faça algumas verificações no formulário, elas precisam existir no backend também, já que a requisição pode vir de fora da tela.


**Pergunta:** Como faço para saber se uma sala já está reservada no horário que outra pessoa quer escolher? Quero entender a lógica de comparação entre data de início e fim. Mostre uma função em TypeScript e explique com exemplos de horários que entram em conflito e horários que não entram.

**A Resposta Bruta da IA:** Há sobreposição quando um intervalo começa antes do fim do outro e termina depois do início dele.

```ts
function sobrepoe(aInicio: Date, aFim: Date, bInicio: Date, bFim: Date) {
  return aInicio < bFim && aFim > bInicio;
}
```

09h–11h conflita com 10h–12h, 09h30–10h e 08h–12h. Não conflita com 07h–09h ou 11h–12h. Pressupõe intervalos válidos e datas com fuso coerente.

**A Crítica e Refatoração do Aluno:** A comparação entre os horários fez sentido, mas não posso olhar só para a hora de início e fim. Também preciso saber se é a mesma sala, no mesmo dia e se a reserva anterior ainda ocupa aquele horário. Quando estiver editando uma reserva, preciso tomar cuidado para ela não ser considerada conflito com ela mesma.


**Pergunta:** Se uma reserva termina às 11h e a próxima começa às 11h, isso deveria ser permitido? Como faço essa comparação sem bloquear horários que não se sobrepõem? Mostre o código da validação e explique cada comparação.

**A Resposta Bruta da IA:** Sim, o projeto permite horários adjacentes, com fim exclusivo.

```ts
const conflito = existente.horarioInicio < nova.horarioFim
  && existente.horarioFim > nova.horarioInicio;
```

A primeira condição exige início anterior ao fim da nova. A segunda exige fim posterior ao início da nova. Se fim e início forem iguais, `>` é falso. Isso representa `[início, fim)`.

**A Crítica e Refatoração do Aluno:** Agora entendi por que uma reserva que termina às 11h não deve impedir outra de começar exatamente às 11h. Se eu usar as comparações erradas, vou bloquear um horário que está livre. Só preciso lembrar que, se a sala ainda estiver sendo usada, o check-in da próxima reserva também deve respeitar essa situação.


**Pergunta:** Se duas pessoas tentarem reservar a mesma sala no mesmo horário, quase ao mesmo tempo, pode acontecer de as duas passarem na verificação de disponibilidade? Por que isso acontece? Mostre um exemplo de código que apresenta o problema e depois explique como corrigir.

**A Resposta Bruta da IA:** Sim: ambas podem consultar antes de qualquer uma gravar.

```ts
// Incorreto sob concorrência:
const ocupada = await prisma.reserva.findFirst({ where: filtroConflito });
if (!ocupada) await prisma.reserva.create({ data: dados });
```

A vê livre; B vê livre; ambas inserem. Use lock transacional por sala/dia antes da consulta e mantenha uma constraint de exclusão. A segunda transação espera e então observa o conflito.

**A Crítica e Refatoração do Aluno:** Essa foi uma parte que eu não tinha pensado: duas pessoas podem ver o mesmo horário disponível antes de qualquer uma salvar. Então fazer apenas uma consulta e depois cadastrar não é suficiente. Preciso de uma proteção no banco para que as duas requisições não consigam confirmar reservas conflitantes.



**Pergunta:** Entendi que consultar a disponibilidade e depois salvar pode causar conflito. Como faço para tratar isso usando Prisma e PostgreSQL? Quero um exemplo com transação e explicação passo a passo do que é verificado e gravado.

**A Resposta Bruta da IA:** Após validar DTO e vínculos da conta, adquira o lock, consulte e grave reserva e histórico na mesma transação.

```ts
return prisma.$transaction(async (tx) => {
  const dia = new Date(`${input.data}T00:00:00Z`).getTime() / 86400000;
  await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(${input.espacoId}::integer, ${dia}::integer)`;
  const conflito = await tx.reserva.findFirst({ where: {
    espacoId: input.espacoId, data: new Date(`${input.data}T00:00:00Z`),
    status: { notIn: ['CANCELADA', 'FINALIZADA'] },
    horarioInicio: { lt: input.horarioFim }, horarioFim: { gt: input.horarioInicio },
  } });
  if (conflito) throw new ConflictException('Horário indisponível.');
  const criada = await tx.reserva.create({ data: {
    contaId: actor.id, usuarioId: input.usuarioId, espacoId: input.espacoId,
    data: new Date(`${input.data}T00:00:00Z`),
    horarioInicio: input.horarioInicio, horarioFim: input.horarioFim,
  } });
  await tx.historicoReserva.create({ data: {
    reservaId: criada.id, tipoEvento: 'CRIACAO', novoEstado: 'PENDENTE',
    autorId: actor.id, justificativa: 'Reserva criada.',
  } });
  return criada;
});
```

A chave combina sala e dia. O lock termina com a transação; uma exceção desfaz as inserções. A consulta usa estados que ocupam a agenda.

**A Crítica e Refatoração do Aluno:** Entendi que a transação agrupa as operações e que o bloqueio ajuda a evitar que duas reservas sejam criadas ao mesmo tempo para a mesma sala e data. Também vi que as consultas e gravações precisam usar o `tx` recebido dentro da transação. Se uma etapa falhar, a reserva e seu histórico não devem ficar salvos pela metade.


**Pergunta:** Mesmo usando o backend, quero garantir que o banco impeça duas reservas com horários sobrepostos para a mesma sala. Existe alguma restrição no PostgreSQL para isso? Mostre um exemplo de SQL e explique quando ele funciona e quais status devem bloquear um horário.

**A Resposta Bruta da IA:** Use uma exclusão GiST. O recorte segue a estratégia do projeto e pressupõe horários válidos.

```sql
ALTER TABLE bi3041468.reservas ADD CONSTRAINT reservas_sem_sobreposicao
EXCLUDE USING gist (
  (int4range(espaco_id, espaco_id, '[]')) WITH &&,
  (daterange(data, data, '[]')) WITH &&,
  (int4range(
    split_part(horario_inicio, ':', 1)::int * 60 + split_part(horario_inicio, ':', 2)::int,
    split_part(horario_fim, ':', 1)::int * 60 + split_part(horario_fim, ':', 2)::int,
    '[)'
  )) WITH &&
) WHERE (status IN ('PENDENTE', 'CONFIRMADA', 'EM_ANDAMENTO'));
```

`&&` significa sobreposição. Os ranges de sala e data representam igualdade; o terceiro representa minutos do dia com fim exclusivo. Rejeita quando as três dimensões se sobrepõem em reservas ativas. Canceladas e finalizadas não bloqueiam.

**A Crítica e Refatoração do Aluno:** Eu conhecia a ideia de colocar `UNIQUE` em uma coluna, mas ela não resolve quando os horários são diferentes e mesmo assim se cruzam. Nesse caso, o PostgreSQL pode usar uma regra para detectar a sobreposição dos períodos. O código SQL é mais avançado, então preciso entender bem os intervalos antes de mexer nessa proteção.


**Pergunta:** Ainda estou com dúvida: por que só usar um if verificando se a sala está livre não resolve tudo? Explique a diferença entre validar a regra e proteger contra duas requisições simultâneas. Mostre um código simples com o problema e outro com uma solução possível.

**A Resposta Bruta da IA:** Validar decide sobre o que foi observado. Proteger concorrência evita que outra operação invalide a decisão entre consulta e gravação.

```ts
// Vulnerável:
if (!(await existeConflito())) await salvar();
// Esboço protegido: os helpers utilizam a mesma transação.
await prisma.$transaction(async (tx) => {
  await bloquearSalaDia(tx, espacoId, data);
  if (await existeConflito(tx)) throw new ConflictException();
  await salvar(tx);
});
```

O `if` continua útil para informar o conflito. O lock serializa operações cooperantes; a constraint é a proteção final de integridade.

**A Crítica e Refatoração do Aluno:** A diferença ficou mais clara: o `if` verifica se havia conflito naquele momento, mas outra requisição pode mudar a situação logo depois. Por isso, a consulta e a gravação precisam acontecer com a proteção adequada. Os nomes das funções do exemplo servem para explicar a lógica; preciso conferir os métodos que realmente existem no projeto.


**Pergunta:** E se duas pessoas abrirem a mesma reserva e tentarem alterar seus dados ao mesmo tempo? Como impedir que a segunda alteração apague a primeira sem perceber? Mostre um exemplo em NestJS e Prisma usando uma versão ou data de atualização e explique como identificar o conflito.

**A Resposta Bruta da IA:** Envie a versão vista na tela e compare depois de adquirir o lock.

```ts
// Dentro da transação:
await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(${id}::bigint)`;
const atual = await tx.reserva.findFirst({ where: { id, contaId: actor.id } });
if (!atual) throw new NotFoundException();
if (atual.updatedAt.toISOString() !== dto.updatedAtEsperado) {
  throw new ConflictException('Reserva alterada. Revise os dados.');
}
// Após validar estado, referências e disponibilidade:
await tx.reserva.update({ where: { id }, data: {
  horarioFim: dto.horarioFim,
  updatedAt: new Date(Math.max(Date.now(), atual.updatedAt.getTime() + 1)),
} });
// Registrar o evento de edição usando tx antes do commit.
```

Duas abas abrem V1. A primeira produz V2. A segunda envia V1 e recebe 409. O incremento mínimo evita reutilizar a versão no mesmo milissegundo.

**A Crítica e Refatoração do Aluno:** Esse exemplo mostrou outro problema: duas pessoas podem abrir a mesma reserva, e a segunda salvar por cima da alteração da primeira. Usar a data da última atualização como versão ajuda a perceber isso. Mas essa versão precisa vir da reserva que a pessoa abriu na tela, e não ser buscada novamente só na hora de salvar.


**Pergunta:** Quando uma reserva é cancelada, eu preciso apagar ela do banco para liberar o horário? Como fazer para manter o registro, mas deixar a sala disponível de novo? Mostre uma consulta Prisma de disponibilidade e explique como o status CANCELADA interfere nela.

**A Resposta Bruta da IA:** Não apague: execute uma transição válida para CANCELADA e ignore esse estado na pesquisa.

```ts
const conflito = await tx.reserva.findFirst({ where: {
  espacoId, data: dia,
  status: { notIn: ['CANCELADA', 'FINALIZADA'] },
  horarioInicio: { lt: fimSolicitado }, horarioFim: { gt: inicioSolicitado },
} });
```

A cancelada continua consultável, mas não satisfaz o filtro. A constraint usa a mesma definição de estados ativos.

**A Crítica e Refatoração do Aluno:** Eu pensei que cancelar poderia significar apagar a reserva, mas isso faria perder informações importantes. É melhor manter o registro com status CANCELADA e fazer a consulta de horários ignorar reservas canceladas. Assim a sala fica disponível de novo, e o sistema continua sabendo que aquela reserva existiu.


**Pergunta:** Se a pessoa já fez check-in, devo permitir cancelar a reserva ou o correto é finalizar o uso? Como posso transformar essa decisão em uma regra do backend? Mostre um exemplo de código com uma validação da ação e explique o motivo dessa regra.

**A Resposta Bruta da IA:** No projeto, uso iniciado deve terminar por checkout.

```ts
resolverTransicao('EM_ANDAMENTO', 'FINALIZAR'); // FINALIZADA
resolverTransicao('EM_ANDAMENTO', 'CANCELAR'); // lança erro
```

O cancelamento descreve desistência antes do uso. Finalizar preserva o sentido do ciclo, registra `checkOutReal` e libera a ocupação física.

**A Crítica e Refatoração do Aluno:** Faz sentido não tratar cancelamento e finalização como a mesma coisa. Se a pessoa ainda não começou a usar a sala, ela pode cancelar. Depois do check-in, o correto no fluxo do projeto é registrar a saída e finalizar. Essa regra precisa ser controlada pelo backend, e não depender só dos botões que aparecem na tela.



## 3. Rastreabilidade e Trilha de Auditoria (Audit Log)

**Pergunta:** Preciso colocar um histórico de alterações nas reservas, mas ainda não entendi direito o que é Audit Log. Pode explicar com um exemplo do meu sistema e mostrar uma estrutura simples em TypeScript? Quero saber o que vale a pena guardar e por quê.

**A Resposta Bruta da IA:** Audit Log é uma sequência persistente de eventos que explica o que aconteceu. Cada mudança acrescenta um evento, sem substituir os anteriores.

```ts
interface EventoReserva {
  reservaId: number;
  tipoEvento: 'CRIACAO' | 'EDICAO' | 'TRANSICAO';
  estadoAnterior: StatusReserva | null;
  novoEstado: StatusReserva;
  autorId: number | null;
  justificativa: string;
  timestamp: Date;
}
```

Reserva identifica o objeto; tipo distingue a operação; estados explicam o caminho; autor, momento e motivo explicam responsabilidade e contexto. Edições também devem guardar os valores anteriores e novos dos campos.

**A Crítica e Refatoração do Aluno:** No começo eu pensava no histórico como uma mensagem mostrando a última alteração. Agora entendi que ele precisa guardar vários acontecimentos, sem apagar os anteriores. Para uma reserva, quero conseguir ver o que mudou, quem fez a ação e quando aconteceu. Também preciso evitar colocar informações sensíveis nesses registros.



**Pergunta:** Quando uma reserva for confirmada, iniciada, finalizada ou cancelada, quero saber quem fez isso, quando e qual era o status anterior. Quais campos preciso salvar? Mostre um exemplo de tabela/modelo no Prisma e explique a função de cada campo.

**A Resposta Bruta da IA:** Estes são os campos principais; as relações complementares estão no próximo item.

```prisma
model HistoricoReserva {
  idRegistro Int @id @default(autoincrement()) @map("id_registro")
  reservaId Int @map("reserva_id")
  tipoEvento TipoEventoReserva? @map("tipo_evento")
  estadoAnterior StatusReserva? @map("estado_anterior")
  novoEstado StatusReserva @map("novo_estado")
  autorId Int? @map("autor_id")
  justificativa String @db.Text
  timestamp DateTime @default(now())
  dadosAnteriores Json? @map("dados_anteriores")
  dadosNovos Json? @map("dados_novos")
  // Incorporar as relações apresentadas no PROMPT 26.
  @@index([reservaId, timestamp])
  @@map("historico_reservas")
}
```

ID identifica o evento; reservaId identifica a reserva. Estados representam antes/depois, autor identifica quem agiu, timestamp informa quando e justificativa explica por quê. JSONs guardam alterações do agendamento; tipoEvento distingue criação, edição e transição.

**A Crítica e Refatoração do Aluno:** Esse modelo me ajudou a visualizar quais dados cada evento precisa guardar. O ID identifica o registro do histórico, enquanto o `reservaId` liga o evento à reserva. Além do status anterior e do novo, faz sentido guardar a pessoa responsável, a data e o motivo. Só o campo numérico não cria essa ligação sozinho; preciso definir o relacionamento no Prisma.


**Pergunta:** Como faço para uma reserva ter vários registros de histórico sem sobrescrever os anteriores? Mostre como criar esse relacionamento no schema do Prisma e explique como os dados ficam ligados no PostgreSQL.

**A Resposta Bruta da IA:** A reserva tem uma coleção, e cada evento aponta para uma reserva. Estas linhas devem ser incorporadas aos modelos completos:

```prisma
// Dentro de Reserva:
historicos HistoricoReserva[]
// Dentro de Conta:
historicosReserva HistoricoReserva[] @relation("AutorHistoricoReserva")
// Dentro de HistoricoReserva, além de reservaId e autorId:
reserva Reserva @relation(fields: [reservaId], references: [id], onDelete: Restrict)
autor Conta? @relation("AutorHistoricoReserva", fields: [autorId], references: [id], onDelete: Restrict)
```

As FKs apontam para reserva e conta existentes. Eventos 1, 2 e 3 podem compartilhar reservaId. Inserir outro evento não substitui nenhum anterior.

**A Crítica e Refatoração do Aluno:** Agora entendi o relacionamento: uma reserva pode ter vários registros de histórico, mas cada registro pertence a uma reserva. Se eu colocar `@unique` no `reservaId`, acabaria permitindo apenas um evento, o que não serve para o que preciso. Também não quero que o histórico desapareça se alguém tentar excluir a reserva.


**Pergunta:** Quando o usuário confirmar ou cancelar uma reserva, como faço para salvar a mudança de status e também adicionar um registro no histórico? Mostre um exemplo de código com NestJS e Prisma e explique a ordem das operações.

**A Resposta Bruta da IA:** Na transação, bloqueie, releia e valide a reserva; depois atualize e insira o evento.

```ts
// Dentro da transação, após locks, autorização e validações:
await tx.reserva.update({ where: { id }, data: { status: destino } });
await tx.historicoReserva.create({ data: {
  reservaId: id, tipoEvento: 'TRANSICAO', estadoAnterior: atual.status,
  novoEstado: destino, autorId: actor.id, justificativa: motivo.trim(),
} });
```

Primeiro altera o registro atual, depois acrescenta um evento. O estado anterior vem da leitura protegida, nunca de um valor escolhido no JSON.

**A Crítica e Refatoração do Aluno:** A ideia é mudar o status e criar mais um registro no histórico sempre que a ação acontecer. Só que esse pedaço de código sozinho ainda não verifica se a mudança é permitida ou se a conta tem acesso à reserva. Preciso juntar essas validações com a gravação, usando os dados da reserva atual e da pessoa logada.


**Pergunta:** E se a mudança de status der certo, mas a gravação do histórico falhar? Eu não quero deixar uma reserva alterada sem registrar quem fez isso. Como uma transação resolve o problema? Mostre o código com prisma.$transaction e explique o que acontece quando uma das operações falha.

**A Resposta Bruta da IA:** A transação confirma ou desfaz o conjunto.

```ts
await prisma.$transaction(async (tx) => {
  await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(${id}::bigint)`;
  const atual = await tx.reserva.findFirst({ where: { id, contaId: actor.id } });
  if (!atual) throw new NotFoundException();
  if (atual.updatedAt.toISOString() !== versaoEsperada) throw new ConflictException();
  const destino = resolverTransicao(atual.status, acao);
  // Política e guardas também integram o fluxo completo.
  await tx.reserva.update({ where: { id }, data: { status: destino } });
  await tx.historicoReserva.create({ data: {
    reservaId: id, tipoEvento: 'TRANSICAO', estadoAnterior: atual.status,
    novoEstado: destino, autorId: actor.id, justificativa: motivo,
  } });
});
```

Se a FK do autor ou outra restrição impedir o evento, o UPDATE sofre rollback. O await faz a falha interromper o callback antes do commit.

**A Crítica e Refatoração do Aluno:** Essa parte me ajudou a entender por que a transação é importante para o Audit Log. Se o sistema mudar o status, mas não conseguir registrar o histórico, não deve deixar só metade do processo salva. Também preciso usar o mesmo `tx` nas duas operações e não ignorar um erro que acontecer ao salvar o evento.


**Pergunta:** Depois de salvar os eventos, como faço para buscar e mostrar o histórico de uma reserva em ordem cronológica? Quero um exemplo de rota no NestJS, consulta no Prisma e uma ideia simples de como exibir isso no frontend, explicando cada parte.

**A Resposta Bruta da IA:** Exponha uma rota protegida, filtre a conta e ordene por instante/ID.

```ts
@Get(':id/historico')
@UseGuards(AuthSessionGuard)
async historico(@Param('id', ParseIntPipe) id: number,
  @CurrentUser() actor: AuthenticatedUser) {
  if (!(await this.repo.findById(id, actor.id))) throw new NotFoundException();
  return this.repo.findHistory(id, actor.id);
}
// Repositório:
return prisma.historicoReserva.findMany({
  where: { reservaId: id, reserva: { contaId } },
  include: { autor: { select: { id: true, nome: true } } },
  orderBy: [{ timestamp: 'asc' }, { idRegistro: 'asc' }],
});
```

```tsx
<ol>{historico.map((e) => <li key={e.idRegistro}>
  {e.estadoAnterior ?? 'NOVA'} → {e.novoEstado}
  <p>{e.justificativa}</p>
  <time>{new Date(e.timestamp).toLocaleString('pt-BR')}</time>
</li>)}</ol>
```

O ID desempata timestamps iguais. A chave estável identifica cada item da lista cronológica.

**A Crítica e Refatoração do Aluno:** Depois de guardar os eventos, preciso conseguir mostrá-los na tela em uma ordem que faça sentido. A consulta por data e ID ajuda a manter essa ordem, e o filtro da conta impede que o histórico de outra pessoa apareça. Além do status, seria útil mostrar quem fez a ação, o motivo e quais dados foram alterados.


**Pergunta:** Se cada conta só pode acessar suas reservas, como garantir que ela também não consiga ver o histórico de outra conta informando um ID na URL? Mostre um exemplo de validação no backend e explique por que não basta esconder o botão na interface.

**A Resposta Bruta da IA:** Confira a reserva da conta e preserve o filtro na consulta dos eventos.

```ts
if (!(await repo.findById(id, actor.id))) throw new NotFoundException();
return prisma.historicoReserva.findMany({
  where: { reservaId: id, reserva: { contaId: actor.id } },
  orderBy: [{ timestamp: 'asc' }, { idRegistro: 'asc' }],
});
```

Esconder o botão só altera a interface. A pessoa ainda pode informar a URL ou fazer uma requisição direta; o filtro no servidor impede a leitura.

**A Crítica e Refatoração do Aluno:** Percebi que proteger a reserva não é suficiente se a rota do histórico aceitar qualquer ID. Mesmo que o botão fique escondido, alguém ainda pode tentar acessar a URL diretamente. Por isso, a consulta do histórico também precisa verificar se a reserva pertence à conta que está logada.


**Pergunta:** Um histórico serve para mostrar o que aconteceu antes. Então, como posso evitar que um registro antigo seja alterado ou apagado sem querer? Mostre uma opção de proteção no PostgreSQL e explique os cuidados e limitações dela.

**A Resposta Bruta da IA:** Um trigger rejeita UPDATE e DELETE, mantendo INSERT para novos eventos.

```sql
CREATE OR REPLACE FUNCTION bi3041468.proteger_historico_reserva()
RETURNS trigger LANGUAGE plpgsql AS $audit$
BEGIN
  RAISE EXCEPTION 'O historico de reservas e imutavel.' USING ERRCODE = '23514';
END;
$audit$;
CREATE TRIGGER historico_reservas_imutavel
BEFORE UPDATE OR DELETE ON bi3041468.historico_reservas
FOR EACH ROW EXECUTE FUNCTION bi3041468.proteger_historico_reserva();
```

A exceção bloqueia a operação antes de alterar a linha. Uma correção deve acrescentar um evento, preservando o original.

**A Crítica e Refatoração do Aluno:** Se o objetivo é guardar o que aconteceu, não faz sentido permitir que um evento antigo seja editado ou apagado normalmente. O trigger pode ajudar a impedir isso no banco. Mas entendi que essa proteção tem limites e não substitui o cuidado com as permissões e com os backups.


**Pergunta:** Como faço para testar se cada mudança gera um novo registro no histórico e se uma falha ao gravar o evento desfaz também a alteração do status? Mostre um exemplo de teste com NestJS/Prisma e explique o que devo conferir no banco depois da execução.

**A Resposta Bruta da IA:** Teste uma transição válida e depois uma falha real de FK no evento.

```ts
// Fixtures PostgreSQL: reservas PENDENTES com um evento inicial.
await repository.transitionStatus(reserva.id, 'PENDENTE', 'CONFIRMADA', {
  contaId: conta.id, autorId: conta.id, justificativa: 'Aprovação.',
  updatedAtEsperado: reserva.updatedAt,
});
expect(await repository.findHistory(reserva.id, conta.id)).toHaveLength(2);
// autor -1 não existe: injeção de falha pelo repositório, não pela API.
await expect(repository.transitionStatus(outra.id, 'PENDENTE', 'CONFIRMADA', {
  contaId: conta.id, autorId: -1, justificativa: 'Falha de teste.',
  updatedAtEsperado: outra.updatedAt,
})).rejects.toThrow();
const depois = await repository.findById(outra.id, conta.id);
expect(depois?.status).toBe('PENDENTE');
expect(depois?.updatedAt).toBe(outra.updatedAt);
expect(await repository.findHistory(outra.id, conta.id)).toHaveLength(1);
```

O segundo caso preserva estado, versão e contagem. A API não permite ao usuário escolher o autor; o teste acessa a camada de persistência para provocar a falha.

**A Crítica e Refatoração do Aluno:** Esses testes me ajudaram a entender o que preciso conferir: cada ação válida deve criar mais um evento, e uma falha ao salvar o histórico não pode deixar o status alterado. Para ter certeza do rollback, o teste precisa envolver o banco real, não apenas simular que uma função deu erro. Também é importante conferir se a versão da reserva continua igual depois da falha.
