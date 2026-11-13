-- Apply after prisma db push. All changes run in the caller's transaction.
DO $checks$
DECLARE
  regra RECORD;
BEGIN
  FOR regra IN
    SELECT * FROM (VALUES
      ('reservas', 'reservas_usuario_id_positivo', 'usuario_id > 0'),
      ('reservas', 'reservas_espaco_id_positivo', 'espaco_id > 0'),
      ('reservas', 'reservas_horario_inicio_valido', $$horario_inicio ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'$$),
      ('reservas', 'reservas_horario_fim_valido', $$horario_fim ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'$$),
      ('reservas', 'reservas_horario_fim_posterior_inicio', 'horario_inicio < horario_fim'),
      ('espacos', 'espacos_capacidade_positiva', 'capacidade > 0'),
      ('espacos', 'espacos_valor_nao_negativo', 'valor_por_hora >= 0'),
      ('historico_reservas', 'historico_justificativa_preenchida', 'length(trim(justificativa)) > 0')
    ) AS regras(tabela, nome, expressao)
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = regra.nome
        AND conrelid = format('bi3041468.%I', regra.tabela)::regclass
    ) THEN
      EXECUTE format('ALTER TABLE bi3041468.%I ADD CONSTRAINT %I CHECK (%s)',
        regra.tabela, regra.nome, regra.expressao);
    END IF;
  END LOOP;
END; $checks$;

-- Range GiST indexes use PostgreSQL built-ins and do not require btree_gist.
DO $overlap$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'reservas_sem_sobreposicao'
      AND conrelid = 'bi3041468.reservas'::regclass
  ) THEN
    ALTER TABLE bi3041468.reservas
      ADD CONSTRAINT reservas_sem_sobreposicao
      EXCLUDE USING gist (
        (int4range(espaco_id, espaco_id, '[]')) WITH &&,
        (daterange(data, data, '[]')) WITH &&,
        (int4range(
          split_part(horario_inicio, ':', 1)::integer * 60 + split_part(horario_inicio, ':', 2)::integer,
          split_part(horario_fim, ':', 1)::integer * 60 + split_part(horario_fim, ':', 2)::integer,
          '[)'
        )) WITH &&
      ) WHERE (status IN ('PENDENTE', 'CONFIRMADA', 'EM_ANDAMENTO'));
  END IF;
END; $overlap$;

-- Scheduled intervals may be adjacent, but physical use is exclusive.
CREATE UNIQUE INDEX IF NOT EXISTS reservas_um_uso_por_espaco
  ON bi3041468.reservas (espaco_id)
  WHERE status = 'EM_ANDAMENTO';

-- Preserve historical attribution, including records created before login existed.
CREATE OR REPLACE FUNCTION bi3041468.proteger_historico_reserva()
RETURNS trigger LANGUAGE plpgsql AS $audit$
BEGIN
  RAISE EXCEPTION 'O historico de reservas e imutavel.' USING ERRCODE = '23514';
END; $audit$;

DROP TRIGGER IF EXISTS historico_reservas_imutavel ON bi3041468.historico_reservas;
CREATE TRIGGER historico_reservas_imutavel
  BEFORE UPDATE OR DELETE ON bi3041468.historico_reservas
  FOR EACH ROW EXECUTE FUNCTION bi3041468.proteger_historico_reserva();

-- Validate new writes while preserving legacy rows for explicit review.
CREATE OR REPLACE FUNCTION bi3041468.validar_estado_reserva()
RETURNS trigger LANGUAGE plpgsql AS $state$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status <> 'PENDENTE' THEN
    RAISE EXCEPTION 'Reservas devem iniciar pendentes.' USING ERRCODE = '23514';
  END IF;
  IF TG_OP = 'UPDATE' THEN
    IF OLD.status <> NEW.status AND NOT (
      (OLD.status = 'PENDENTE' AND NEW.status IN ('CONFIRMADA', 'CANCELADA')) OR
      (OLD.status = 'CONFIRMADA' AND NEW.status IN ('EM_ANDAMENTO', 'CANCELADA')) OR
      (OLD.status = 'EM_ANDAMENTO' AND NEW.status = 'FINALIZADA')
    ) THEN
      RAISE EXCEPTION 'Transicao de reserva invalida.' USING ERRCODE = '23514';
    END IF;
    IF ROW(OLD.conta_id, OLD.usuario_id, OLD.espaco_id, OLD.data, OLD.horario_inicio, OLD.horario_fim)
       IS DISTINCT FROM ROW(NEW.conta_id, NEW.usuario_id, NEW.espaco_id, NEW.data, NEW.horario_inicio, NEW.horario_fim)
       AND (OLD.status <> 'PENDENTE' OR NEW.status <> 'PENDENTE' OR OLD.conta_id <> NEW.conta_id) THEN
      RAISE EXCEPTION 'Somente agendamentos pendentes podem ser editados.' USING ERRCODE = '23514';
    END IF;
    IF OLD.check_in_real IS NOT NULL AND OLD.check_in_real IS DISTINCT FROM NEW.check_in_real THEN
      RAISE EXCEPTION 'Check-in registrado nao pode ser alterado.' USING ERRCODE = '23514';
    END IF;
    IF OLD.check_out_real IS NOT NULL AND OLD.check_out_real IS DISTINCT FROM NEW.check_out_real THEN
      RAISE EXCEPTION 'Check-out registrado nao pode ser alterado.' USING ERRCODE = '23514';
    END IF;
  END IF;
  IF (NEW.status IN ('PENDENTE', 'CONFIRMADA', 'CANCELADA') AND (NEW.check_in_real IS NOT NULL OR NEW.check_out_real IS NOT NULL))
     OR (NEW.status = 'EM_ANDAMENTO' AND (NEW.check_in_real IS NULL OR NEW.check_out_real IS NOT NULL))
     OR (NEW.status = 'FINALIZADA' AND (NEW.check_in_real IS NULL OR NEW.check_out_real IS NULL OR NEW.check_out_real < NEW.check_in_real)) THEN
    RAISE EXCEPTION 'Estado e horarios reais inconsistentes.' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END; $state$;
DROP TRIGGER IF EXISTS reservas_estado_valido ON bi3041468.reservas;
CREATE TRIGGER reservas_estado_valido BEFORE INSERT OR UPDATE ON bi3041468.reservas
FOR EACH ROW EXECUTE FUNCTION bi3041468.validar_estado_reserva();
