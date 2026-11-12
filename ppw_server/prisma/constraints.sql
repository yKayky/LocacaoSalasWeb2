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
END $checks$;

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
END $overlap$;

-- Scheduled intervals may be adjacent, but physical use is exclusive.
CREATE UNIQUE INDEX IF NOT EXISTS reservas_um_uso_por_espaco
  ON bi3041468.reservas (espaco_id)
  WHERE status = 'EM_ANDAMENTO';

-- Preserve historical attribution, including records created before login existed.
CREATE OR REPLACE FUNCTION bi3041468.proteger_historico_reserva()
RETURNS trigger LANGUAGE plpgsql AS $audit$
BEGIN
  RAISE EXCEPTION 'O historico de reservas e imutavel.' USING ERRCODE = '23514';
END $audit$;

DROP TRIGGER IF EXISTS historico_reservas_imutavel ON bi3041468.historico_reservas;
CREATE TRIGGER historico_reservas_imutavel
  BEFORE UPDATE OR DELETE ON bi3041468.historico_reservas
  FOR EACH ROW EXECUTE FUNCTION bi3041468.proteger_historico_reserva();
