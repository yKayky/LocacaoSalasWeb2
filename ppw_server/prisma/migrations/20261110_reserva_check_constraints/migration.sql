ALTER TABLE "bi3041468"."reservas"
  ADD CONSTRAINT "reservas_usuario_id_positivo"
    CHECK ("usuario_id" > 0),
  ADD CONSTRAINT "reservas_espaco_id_positivo"
    CHECK ("espaco_id" > 0),
  ADD CONSTRAINT "reservas_horario_inicio_valido"
    CHECK ("horario_inicio" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  ADD CONSTRAINT "reservas_horario_fim_valido"
    CHECK ("horario_fim" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  ADD CONSTRAINT "reservas_horario_fim_posterior_inicio"
    CHECK ("horario_inicio" < "horario_fim");
