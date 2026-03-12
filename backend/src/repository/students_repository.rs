use sqlx::PgPool;

use crate::models::student::{MembroFamiliar, PessoaAutorizada, ResponsavelLegal, Student, StudentAuditEvent, StudentDraft, StudentListItem};

fn none_if_blank(value: &str) -> Option<String> {
  let v = value.trim();
  if v.is_empty() {
    None
  } else {
    Some(v.to_string())
  }
}

pub async fn get_students_stats(pool: &PgPool) -> Result<(i64, i64, i64), sqlx::Error> {
  let total: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM students")
    .fetch_one(pool)
    .await?;

  let schools: i64 = sqlx::query_scalar(
    "SELECT COUNT(DISTINCT escola_nome) FROM students WHERE escola_nome IS NOT NULL AND btrim(escola_nome) <> ''",
  )
  .fetch_one(pool)
  .await?;

  let this_month: i64 = sqlx::query_scalar(
    "SELECT COUNT(*) FROM students WHERE created_at >= date_trunc('month', now())",
  )
  .fetch_one(pool)
  .await?;

  Ok((total, schools, this_month))
}

pub async fn get_admin_stats(pool: &PgPool) -> Result<(i64, i64, i64, i64), sqlx::Error> {
  let approved_accounts: i64 = match sqlx::query_scalar::<_, i64>(
    "SELECT COUNT(*) FROM users WHERE deleted_at IS NULL AND COALESCE(status, 'approved') = 'approved'",
  )
  .fetch_one(pool)
  .await
  {
    Ok(v) => v,
    Err(_) => sqlx::query_scalar("SELECT COUNT(*) FROM users WHERE deleted_at IS NULL")
      .fetch_one(pool)
      .await?,
  };

  let pending_accounts: i64 = match sqlx::query_scalar::<_, i64>(
    "SELECT COUNT(*) FROM users WHERE deleted_at IS NULL AND COALESCE(status, 'approved') = 'pending'",
  )
  .fetch_one(pool)
  .await
  {
    Ok(v) => v,
    Err(_) => 0,
  };

  let alunos_adicionados: i64 =
    sqlx::query_scalar("SELECT COUNT(*) FROM student_audit_events WHERE action = 'create'")
      .fetch_one(pool)
      .await?;

  let alteracoes: i64 =
    sqlx::query_scalar("SELECT COUNT(*) FROM student_audit_events WHERE action = 'update'")
      .fetch_one(pool)
      .await?;

  Ok((approved_accounts, pending_accounts, alunos_adicionados, alteracoes))
}

async fn insert_audit_event(pool: &PgPool, student_id: i64, student_name: &str, action: &str, by_email: &str) -> Result<(), sqlx::Error> {
  sqlx::query(
    "INSERT INTO student_audit_events (student_id, student_name, action, by_email) VALUES ($1, $2, $3, $4)",
  )
  .bind(student_id)
  .bind(student_name)
  .bind(action)
  .bind(by_email)
  .execute(pool)
  .await?;
  Ok(())
}

pub async fn list_students(pool: &PgPool) -> Result<Vec<StudentListItem>, sqlx::Error> {
  #[derive(sqlx::FromRow)]
  struct Row {
    id: i64,
    nome_completo: String,
    idade: Option<i32>,
    nome_mae: Option<String>,
    escola_nome: Option<String>,
    sexo: Option<String>,
    cpf: Option<String>,
  }

  let rows: Vec<Row> = sqlx::query_as(
    "SELECT id, nome_completo, idade, nome_mae, escola_nome, sexo, cpf FROM students ORDER BY id DESC",
  )
  .fetch_all(pool)
  .await?;

  Ok(
    rows
      .into_iter()
      .map(|r| StudentListItem {
        id: r.id.to_string(),
        nome_completo: r.nome_completo,
        idade: r.idade,
        nome_mae: r.nome_mae,
        escola_nome: r.escola_nome,
        sexo: r.sexo,
        cpf: r.cpf,
      })
      .collect(),
  )
}

pub async fn get_student(pool: &PgPool, id: i64) -> Result<Option<Student>, sqlx::Error> {
  #[derive(sqlx::FromRow)]
  struct BaseRow {
    id: i64,
    nome_completo: String,
    data_nascimento: String,
    idade: Option<i32>,
    naturalidade: String,
    raca_cor: String,
    sexo: String,
    rg: String,
    cpf: String,
    nis: String,
    certidao_termo: String,
    certidao_folha: String,
    certidao_livro: String,
    endereco_cep: String,
    endereco_logradouro: String,
    endereco_numero: String,
    endereco_complemento: String,
    endereco_bairro: String,
    endereco_cidade: String,
    endereco_uf: String,
    nome_pai: String,
    nome_mae: String,
    cras_referencia: String,
    estado_civil_pais: String,
    contato_conjuge_nome: String,
    contato_conjuge_telefone: String,
    tipo_domicilio: String,
    renda_familiar: String,
    escola_nome: String,
    escola_serie: String,
    escola_ano: String,
    escola_professor: String,
    escola_periodo: String,
    historico_escolar: String,
    ubs_referencia: String,
    tem_problema_saude: bool,
    problema_saude_descricao: String,
    tem_restricoes: bool,
    restricoes_descricao: String,
    usa_medicamentos: bool,
    medicamentos_descricao: String,
    tem_alergias: bool,
    alergias_descricao: String,
    acompanhamentos: String,
    tem_deficiencia: bool,
    deficiencia_descricao: String,
    tem_supervisao: bool,
    supervisao_descricao: String,
    atividades_extras: String,
    termo_responsabilidade: bool,
    autorizacao_imagem: bool,
    autorizacao_saida: String,
  }

  let base: Option<BaseRow> = sqlx::query_as(
    r#"
      SELECT
        id,
        nome_completo,
        COALESCE(to_char(data_nascimento, 'YYYY-MM-DD'), '') AS data_nascimento,
        idade,
        COALESCE(naturalidade, '') AS naturalidade,
        COALESCE(raca_cor, '') AS raca_cor,
        COALESCE(sexo, '') AS sexo,
        COALESCE(rg, '') AS rg,
        COALESCE(cpf, '') AS cpf,
        COALESCE(nis, '') AS nis,
        COALESCE(certidao_termo, '') AS certidao_termo,
        COALESCE(certidao_folha, '') AS certidao_folha,
        COALESCE(certidao_livro, '') AS certidao_livro,
        COALESCE(endereco_cep, '') AS endereco_cep,
        COALESCE(endereco_logradouro, '') AS endereco_logradouro,
        COALESCE(endereco_numero, '') AS endereco_numero,
        COALESCE(endereco_complemento, '') AS endereco_complemento,
        COALESCE(endereco_bairro, '') AS endereco_bairro,
        COALESCE(endereco_cidade, '') AS endereco_cidade,
        COALESCE(endereco_uf, '') AS endereco_uf,
        COALESCE(nome_pai, '') AS nome_pai,
        COALESCE(nome_mae, '') AS nome_mae,
        COALESCE(cras_referencia, '') AS cras_referencia,
        COALESCE(estado_civil_pais, '') AS estado_civil_pais,
        COALESCE(contato_conjuge_nome, '') AS contato_conjuge_nome,
        COALESCE(contato_conjuge_telefone, '') AS contato_conjuge_telefone,
        COALESCE(tipo_domicilio, '') AS tipo_domicilio,
        COALESCE(renda_familiar, '') AS renda_familiar,
        COALESCE(escola_nome, '') AS escola_nome,
        COALESCE(escola_serie, '') AS escola_serie,
        COALESCE(escola_ano, '') AS escola_ano,
        COALESCE(escola_professor, '') AS escola_professor,
        COALESCE(escola_periodo, '') AS escola_periodo,
        COALESCE(historico_escolar, '') AS historico_escolar,
        COALESCE(ubs_referencia, '') AS ubs_referencia,
        tem_problema_saude,
        COALESCE(problema_saude_descricao, '') AS problema_saude_descricao,
        tem_restricoes,
        COALESCE(restricoes_descricao, '') AS restricoes_descricao,
        usa_medicamentos,
        COALESCE(medicamentos_descricao, '') AS medicamentos_descricao,
        tem_alergias,
        COALESCE(alergias_descricao, '') AS alergias_descricao,
        COALESCE(acompanhamentos, '') AS acompanhamentos,
        tem_deficiencia,
        COALESCE(deficiencia_descricao, '') AS deficiencia_descricao,
        tem_supervisao,
        COALESCE(supervisao_descricao, '') AS supervisao_descricao,
        COALESCE(atividades_extras, '') AS atividades_extras,
        termo_responsabilidade,
        autorizacao_imagem,
        COALESCE(autorizacao_saida, '') AS autorizacao_saida
      FROM students
      WHERE id = $1
    "#,
  )
  .bind(id)
  .fetch_optional(pool)
  .await?;

  let Some(base) = base else { return Ok(None) };

  #[derive(sqlx::FromRow)]
  struct RespRow {
    nome: String,
    data_nascimento: String,
    rg: String,
    cpf: String,
    celular: String,
    operadora: String,
    whatsapp: String,
    fixo: String,
    parentesco: String,
  }

  let responsaveis: Vec<ResponsavelLegal> = sqlx::query_as::<_, RespRow>(
    r#"
      SELECT
        COALESCE(nome, '') AS nome,
        COALESCE(to_char(data_nascimento, 'YYYY-MM-DD'), '') AS data_nascimento,
        COALESCE(rg, '') AS rg,
        COALESCE(cpf, '') AS cpf,
        COALESCE(celular, '') AS celular,
        COALESCE(operadora, '') AS operadora,
        COALESCE(whatsapp, '') AS whatsapp,
        COALESCE(fixo, '') AS fixo,
        COALESCE(parentesco, '') AS parentesco
      FROM student_responsaveis_legais
      WHERE student_id = $1
      ORDER BY posicao ASC
    "#,
  )
  .bind(id)
  .fetch_all(pool)
  .await?
  .into_iter()
  .map(|r| ResponsavelLegal {
    nome: r.nome,
    data_nascimento: r.data_nascimento,
    rg: r.rg,
    cpf: r.cpf,
    celular: r.celular,
    operadora: r.operadora,
    whatsapp: r.whatsapp,
    fixo: r.fixo,
    parentesco: r.parentesco,
  })
  .collect();

  #[derive(sqlx::FromRow)]
  struct MembroRow {
    nome: String,
    parentesco: String,
    profissao: String,
    renda: String,
  }

  let membros: Vec<MembroFamiliar> = sqlx::query_as::<_, MembroRow>(
    r#"
      SELECT
        COALESCE(nome, '') AS nome,
        COALESCE(parentesco, '') AS parentesco,
        COALESCE(profissao, '') AS profissao,
        COALESCE(renda, '') AS renda
      FROM student_membros_familiares
      WHERE student_id = $1
      ORDER BY id ASC
    "#,
  )
  .bind(id)
  .fetch_all(pool)
  .await?
  .into_iter()
  .map(|m| MembroFamiliar {
    nome: m.nome,
    parentesco: m.parentesco,
    profissao: m.profissao,
    renda: m.renda,
  })
  .collect();

  #[derive(sqlx::FromRow)]
  struct PessoaRow {
    nome: String,
    documento: String,
    parentesco: String,
    telefone: String,
  }

  let pessoas: Vec<PessoaAutorizada> = sqlx::query_as::<_, PessoaRow>(
    r#"
      SELECT
        COALESCE(nome, '') AS nome,
        COALESCE(documento, '') AS documento,
        COALESCE(parentesco, '') AS parentesco,
        COALESCE(telefone, '') AS telefone
      FROM student_pessoas_autorizadas
      WHERE student_id = $1
      ORDER BY id ASC
    "#,
  )
  .bind(id)
  .fetch_all(pool)
  .await?
  .into_iter()
  .map(|p| PessoaAutorizada {
    nome: p.nome,
    documento: p.documento,
    parentesco: p.parentesco,
    telefone: p.telefone,
  })
  .collect();

  #[derive(sqlx::FromRow)]
  struct SingleTextRow {
    value: String,
  }

  let beneficios: Vec<String> = sqlx::query_as::<_, SingleTextRow>(
    "SELECT beneficio AS value FROM student_beneficios WHERE student_id = $1 ORDER BY beneficio ASC",
  )
  .bind(id)
  .fetch_all(pool)
  .await?
  .into_iter()
  .map(|r| r.value)
  .collect();

  let interacao_social: Vec<String> = sqlx::query_as::<_, SingleTextRow>(
    "SELECT item AS value FROM student_interacao_social WHERE student_id = $1 ORDER BY item ASC",
  )
  .bind(id)
  .fetch_all(pool)
  .await?
  .into_iter()
  .map(|r| r.value)
  .collect();

  let locais_lazer: Vec<String> = sqlx::query_as::<_, SingleTextRow>(
    "SELECT item AS value FROM student_locais_lazer WHERE student_id = $1 ORDER BY item ASC",
  )
  .bind(id)
  .fetch_all(pool)
  .await?
  .into_iter()
  .map(|r| r.value)
  .collect();

  let servicos_utilizados: Vec<String> = sqlx::query_as::<_, SingleTextRow>(
    "SELECT item AS value FROM student_servicos_utilizados WHERE student_id = $1 ORDER BY item ASC",
  )
  .bind(id)
  .fetch_all(pool)
  .await?
  .into_iter()
  .map(|r| r.value)
  .collect();

  let data = StudentDraft {
    nome_completo: base.nome_completo,
    data_nascimento: base.data_nascimento,
    idade: base.idade,
    naturalidade: base.naturalidade,
    raca_cor: base.raca_cor,
    sexo: base.sexo,
    rg: base.rg,
    cpf: base.cpf,
    nis: base.nis,
    certidao_termo: base.certidao_termo,
    certidao_folha: base.certidao_folha,
    certidao_livro: base.certidao_livro,
    endereco_cep: base.endereco_cep,
    endereco_logradouro: base.endereco_logradouro,
    endereco_numero: base.endereco_numero,
    endereco_complemento: base.endereco_complemento,
    endereco_bairro: base.endereco_bairro,
    endereco_cidade: base.endereco_cidade,
    endereco_uf: base.endereco_uf,
    nome_pai: base.nome_pai,
    nome_mae: base.nome_mae,
    cras_referencia: base.cras_referencia,
    responsaveis_legais: responsaveis,
    membros_familiares: membros,
    estado_civil_pais: base.estado_civil_pais,
    contato_conjuge_nome: base.contato_conjuge_nome,
    contato_conjuge_telefone: base.contato_conjuge_telefone,
    tipo_domicilio: base.tipo_domicilio,
    renda_familiar: base.renda_familiar,
    beneficios,
    escola_nome: base.escola_nome,
    escola_serie: base.escola_serie,
    escola_ano: base.escola_ano,
    escola_professor: base.escola_professor,
    escola_periodo: base.escola_periodo,
    historico_escolar: base.historico_escolar,
    ubs_referencia: base.ubs_referencia,
    tem_problema_saude: base.tem_problema_saude,
    problema_saude_descricao: base.problema_saude_descricao,
    tem_restricoes: base.tem_restricoes,
    restricoes_descricao: base.restricoes_descricao,
    usa_medicamentos: base.usa_medicamentos,
    medicamentos_descricao: base.medicamentos_descricao,
    tem_alergias: base.tem_alergias,
    alergias_descricao: base.alergias_descricao,
    acompanhamentos: base.acompanhamentos,
    tem_deficiencia: base.tem_deficiencia,
    deficiencia_descricao: base.deficiencia_descricao,
    tem_supervisao: base.tem_supervisao,
    supervisao_descricao: base.supervisao_descricao,
    interacao_social,
    locais_lazer,
    atividades_extras: base.atividades_extras,
    servicos_utilizados,
    termo_responsabilidade: base.termo_responsabilidade,
    autorizacao_imagem: base.autorizacao_imagem,
    autorizacao_saida: base.autorizacao_saida,
    pessoas_autorizadas: pessoas,
  };

  Ok(Some(Student { id: base.id.to_string(), data }))
}

pub async fn create_student(pool: &PgPool, draft: StudentDraft, by_email: &str) -> Result<Student, sqlx::Error> {
  let data_nascimento = none_if_blank(&draft.data_nascimento);
  let autorizacao_saida = none_if_blank(&draft.autorizacao_saida);

  let mut tx = pool.begin().await?;

  let id: i64 = sqlx::query_scalar(
    r#"
      INSERT INTO students (
        nome_completo,
        data_nascimento,
        idade,
        naturalidade,
        raca_cor,
        sexo,
        rg,
        cpf,
        nis,
        certidao_termo,
        certidao_folha,
        certidao_livro,
        endereco_cep,
        endereco_logradouro,
        endereco_numero,
        endereco_complemento,
        endereco_bairro,
        endereco_cidade,
        endereco_uf,
        nome_pai,
        nome_mae,
        cras_referencia,
        estado_civil_pais,
        contato_conjuge_nome,
        contato_conjuge_telefone,
        tipo_domicilio,
        renda_familiar,
        escola_nome,
        escola_serie,
        escola_ano,
        escola_professor,
        escola_periodo,
        historico_escolar,
        ubs_referencia,
        tem_problema_saude,
        problema_saude_descricao,
        tem_restricoes,
        restricoes_descricao,
        usa_medicamentos,
        medicamentos_descricao,
        tem_alergias,
        alergias_descricao,
        acompanhamentos,
        tem_deficiencia,
        deficiencia_descricao,
        tem_supervisao,
        supervisao_descricao,
        atividades_extras,
        termo_responsabilidade,
        autorizacao_imagem,
        autorizacao_saida,
        created_by_email,
        updated_by_email
      ) VALUES (
        $1,
        CAST($2 AS date),
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12,
        $13,
        $14,
        $15,
        $16,
        $17,
        $18,
        $19,
        $20,
        $21,
        $22,
        $23,
        $24,
        $25,
        $26,
        $27,
        $28,
        $29,
        $30,
        $31,
        $32,
        $33,
        $34,
        $35,
        $36,
        $37,
        $38,
        $39,
        $40,
        $41,
        $42,
        $43,
        $44,
        $45,
        $46,
        $47,
        $48,
        $49,
        $50,
        $51,
        $52
      )
      RETURNING id
    "#,
  )
  .bind(&draft.nome_completo)
  .bind(data_nascimento)
  .bind(draft.idade)
  .bind(none_if_blank(&draft.naturalidade))
  .bind(none_if_blank(&draft.raca_cor))
  .bind(none_if_blank(&draft.sexo))
  .bind(none_if_blank(&draft.rg))
  .bind(none_if_blank(&draft.cpf))
  .bind(none_if_blank(&draft.nis))
  .bind(none_if_blank(&draft.certidao_termo))
  .bind(none_if_blank(&draft.certidao_folha))
  .bind(none_if_blank(&draft.certidao_livro))
  .bind(none_if_blank(&draft.endereco_cep))
  .bind(none_if_blank(&draft.endereco_logradouro))
  .bind(none_if_blank(&draft.endereco_numero))
  .bind(none_if_blank(&draft.endereco_complemento))
  .bind(none_if_blank(&draft.endereco_bairro))
  .bind(none_if_blank(&draft.endereco_cidade))
  .bind(none_if_blank(&draft.endereco_uf))
  .bind(none_if_blank(&draft.nome_pai))
  .bind(none_if_blank(&draft.nome_mae))
  .bind(none_if_blank(&draft.cras_referencia))
  .bind(none_if_blank(&draft.estado_civil_pais))
  .bind(none_if_blank(&draft.contato_conjuge_nome))
  .bind(none_if_blank(&draft.contato_conjuge_telefone))
  .bind(none_if_blank(&draft.tipo_domicilio))
  .bind(none_if_blank(&draft.renda_familiar))
  .bind(none_if_blank(&draft.escola_nome))
  .bind(none_if_blank(&draft.escola_serie))
  .bind(none_if_blank(&draft.escola_ano))
  .bind(none_if_blank(&draft.escola_professor))
  .bind(none_if_blank(&draft.escola_periodo))
  .bind(none_if_blank(&draft.historico_escolar))
  .bind(none_if_blank(&draft.ubs_referencia))
  .bind(draft.tem_problema_saude)
  .bind(none_if_blank(&draft.problema_saude_descricao))
  .bind(draft.tem_restricoes)
  .bind(none_if_blank(&draft.restricoes_descricao))
  .bind(draft.usa_medicamentos)
  .bind(none_if_blank(&draft.medicamentos_descricao))
  .bind(draft.tem_alergias)
  .bind(none_if_blank(&draft.alergias_descricao))
  .bind(none_if_blank(&draft.acompanhamentos))
  .bind(draft.tem_deficiencia)
  .bind(none_if_blank(&draft.deficiencia_descricao))
  .bind(draft.tem_supervisao)
  .bind(none_if_blank(&draft.supervisao_descricao))
  .bind(none_if_blank(&draft.atividades_extras))
  .bind(draft.termo_responsabilidade)
  .bind(draft.autorizacao_imagem)
  .bind(autorizacao_saida)
  .bind(by_email)
  .bind(by_email)
  .fetch_one(&mut *tx)
  .await?;

  for (idx, r) in draft.responsaveis_legais.iter().take(2).enumerate() {
    sqlx::query(
      r#"
        INSERT INTO student_responsaveis_legais (
          student_id, posicao, nome, data_nascimento, rg, cpf, celular, operadora, whatsapp, fixo, parentesco
        ) VALUES (
          $1, $2, $3, CAST($4 AS date), $5, $6, $7, $8, $9, $10, $11
        )
        ON CONFLICT (student_id, posicao) DO UPDATE SET
          nome = EXCLUDED.nome,
          data_nascimento = EXCLUDED.data_nascimento,
          rg = EXCLUDED.rg,
          cpf = EXCLUDED.cpf,
          celular = EXCLUDED.celular,
          operadora = EXCLUDED.operadora,
          whatsapp = EXCLUDED.whatsapp,
          fixo = EXCLUDED.fixo,
          parentesco = EXCLUDED.parentesco
      "#,
    )
    .bind(id)
    .bind((idx + 1) as i16)
    .bind(none_if_blank(&r.nome))
    .bind(none_if_blank(&r.data_nascimento))
    .bind(none_if_blank(&r.rg))
    .bind(none_if_blank(&r.cpf))
    .bind(none_if_blank(&r.celular))
    .bind(none_if_blank(&r.operadora))
    .bind(none_if_blank(&r.whatsapp))
    .bind(none_if_blank(&r.fixo))
    .bind(none_if_blank(&r.parentesco))
    .execute(&mut *tx)
    .await?;
  }

  for m in &draft.membros_familiares {
    sqlx::query(
      r#"
        INSERT INTO student_membros_familiares (student_id, nome, parentesco, profissao, renda)
        VALUES ($1, $2, $3, $4, $5)
      "#,
    )
    .bind(id)
    .bind(none_if_blank(&m.nome))
    .bind(none_if_blank(&m.parentesco))
    .bind(none_if_blank(&m.profissao))
    .bind(none_if_blank(&m.renda))
    .execute(&mut *tx)
    .await?;
  }

  for p in &draft.pessoas_autorizadas {
    sqlx::query(
      r#"
        INSERT INTO student_pessoas_autorizadas (student_id, nome, documento, parentesco, telefone)
        VALUES ($1, $2, $3, $4, $5)
      "#,
    )
    .bind(id)
    .bind(none_if_blank(&p.nome))
    .bind(none_if_blank(&p.documento))
    .bind(none_if_blank(&p.parentesco))
    .bind(none_if_blank(&p.telefone))
    .execute(&mut *tx)
    .await?;
  }

  for b in &draft.beneficios {
    let v = b.trim();
    if v.is_empty() {
      continue;
    }
    sqlx::query("INSERT INTO student_beneficios (student_id, beneficio) VALUES ($1, $2) ON CONFLICT DO NOTHING")
      .bind(id)
      .bind(v)
      .execute(&mut *tx)
      .await?;
  }

  for v in &draft.interacao_social {
    let t = v.trim();
    if t.is_empty() {
      continue;
    }
    sqlx::query("INSERT INTO student_interacao_social (student_id, item) VALUES ($1, $2) ON CONFLICT DO NOTHING")
      .bind(id)
      .bind(t)
      .execute(&mut *tx)
      .await?;
  }

  for v in &draft.locais_lazer {
    let t = v.trim();
    if t.is_empty() {
      continue;
    }
    sqlx::query("INSERT INTO student_locais_lazer (student_id, item) VALUES ($1, $2) ON CONFLICT DO NOTHING")
      .bind(id)
      .bind(t)
      .execute(&mut *tx)
      .await?;
  }

  for v in &draft.servicos_utilizados {
    let t = v.trim();
    if t.is_empty() {
      continue;
    }
    sqlx::query("INSERT INTO student_servicos_utilizados (student_id, item) VALUES ($1, $2) ON CONFLICT DO NOTHING")
      .bind(id)
      .bind(t)
      .execute(&mut *tx)
      .await?;
  }

  tx.commit().await?;

  insert_audit_event(pool, id, &draft.nome_completo, "create", by_email).await?;

  Ok(Student { id: id.to_string(), data: draft })
}

pub async fn update_student(pool: &PgPool, id: i64, draft: StudentDraft, by_email: &str) -> Result<Option<Student>, sqlx::Error> {
  let existing_name: Option<String> = sqlx::query_scalar("SELECT nome_completo FROM students WHERE id = $1")
    .bind(id)
    .fetch_optional(pool)
    .await?;

  if existing_name.is_none() {
    return Ok(None);
  }

  let data_nascimento = none_if_blank(&draft.data_nascimento);
  let autorizacao_saida = none_if_blank(&draft.autorizacao_saida);

  let mut tx = pool.begin().await?;

  sqlx::query(
    r#"
      UPDATE students SET
        nome_completo = $1,
        data_nascimento = CAST($2 AS date),
        idade = $3,
        naturalidade = $4,
        raca_cor = $5,
        sexo = $6,
        rg = $7,
        cpf = $8,
        nis = $9,
        certidao_termo = $10,
        certidao_folha = $11,
        certidao_livro = $12,
        endereco_cep = $13,
        endereco_logradouro = $14,
        endereco_numero = $15,
        endereco_complemento = $16,
        endereco_bairro = $17,
        endereco_cidade = $18,
        endereco_uf = $19,
        nome_pai = $20,
        nome_mae = $21,
        cras_referencia = $22,
        estado_civil_pais = $23,
        contato_conjuge_nome = $24,
        contato_conjuge_telefone = $25,
        tipo_domicilio = $26,
        renda_familiar = $27,
        escola_nome = $28,
        escola_serie = $29,
        escola_ano = $30,
        escola_professor = $31,
        escola_periodo = $32,
        historico_escolar = $33,
        ubs_referencia = $34,
        tem_problema_saude = $35,
        problema_saude_descricao = $36,
        tem_restricoes = $37,
        restricoes_descricao = $38,
        usa_medicamentos = $39,
        medicamentos_descricao = $40,
        tem_alergias = $41,
        alergias_descricao = $42,
        acompanhamentos = $43,
        tem_deficiencia = $44,
        deficiencia_descricao = $45,
        tem_supervisao = $46,
        supervisao_descricao = $47,
        atividades_extras = $48,
        termo_responsabilidade = $49,
        autorizacao_imagem = $50,
        autorizacao_saida = $51,
        updated_at = now(),
        updated_by_email = $52
      WHERE id = $53
    "#,
  )
  .bind(&draft.nome_completo)
  .bind(data_nascimento)
  .bind(draft.idade)
  .bind(none_if_blank(&draft.naturalidade))
  .bind(none_if_blank(&draft.raca_cor))
  .bind(none_if_blank(&draft.sexo))
  .bind(none_if_blank(&draft.rg))
  .bind(none_if_blank(&draft.cpf))
  .bind(none_if_blank(&draft.nis))
  .bind(none_if_blank(&draft.certidao_termo))
  .bind(none_if_blank(&draft.certidao_folha))
  .bind(none_if_blank(&draft.certidao_livro))
  .bind(none_if_blank(&draft.endereco_cep))
  .bind(none_if_blank(&draft.endereco_logradouro))
  .bind(none_if_blank(&draft.endereco_numero))
  .bind(none_if_blank(&draft.endereco_complemento))
  .bind(none_if_blank(&draft.endereco_bairro))
  .bind(none_if_blank(&draft.endereco_cidade))
  .bind(none_if_blank(&draft.endereco_uf))
  .bind(none_if_blank(&draft.nome_pai))
  .bind(none_if_blank(&draft.nome_mae))
  .bind(none_if_blank(&draft.cras_referencia))
  .bind(none_if_blank(&draft.estado_civil_pais))
  .bind(none_if_blank(&draft.contato_conjuge_nome))
  .bind(none_if_blank(&draft.contato_conjuge_telefone))
  .bind(none_if_blank(&draft.tipo_domicilio))
  .bind(none_if_blank(&draft.renda_familiar))
  .bind(none_if_blank(&draft.escola_nome))
  .bind(none_if_blank(&draft.escola_serie))
  .bind(none_if_blank(&draft.escola_ano))
  .bind(none_if_blank(&draft.escola_professor))
  .bind(none_if_blank(&draft.escola_periodo))
  .bind(none_if_blank(&draft.historico_escolar))
  .bind(none_if_blank(&draft.ubs_referencia))
  .bind(draft.tem_problema_saude)
  .bind(none_if_blank(&draft.problema_saude_descricao))
  .bind(draft.tem_restricoes)
  .bind(none_if_blank(&draft.restricoes_descricao))
  .bind(draft.usa_medicamentos)
  .bind(none_if_blank(&draft.medicamentos_descricao))
  .bind(draft.tem_alergias)
  .bind(none_if_blank(&draft.alergias_descricao))
  .bind(none_if_blank(&draft.acompanhamentos))
  .bind(draft.tem_deficiencia)
  .bind(none_if_blank(&draft.deficiencia_descricao))
  .bind(draft.tem_supervisao)
  .bind(none_if_blank(&draft.supervisao_descricao))
  .bind(none_if_blank(&draft.atividades_extras))
  .bind(draft.termo_responsabilidade)
  .bind(draft.autorizacao_imagem)
  .bind(autorizacao_saida)
  .bind(by_email)
  .bind(id)
  .execute(&mut *tx)
  .await?;

  sqlx::query("DELETE FROM student_responsaveis_legais WHERE student_id = $1").bind(id).execute(&mut *tx).await?;
  sqlx::query("DELETE FROM student_membros_familiares WHERE student_id = $1").bind(id).execute(&mut *tx).await?;
  sqlx::query("DELETE FROM student_pessoas_autorizadas WHERE student_id = $1").bind(id).execute(&mut *tx).await?;
  sqlx::query("DELETE FROM student_beneficios WHERE student_id = $1").bind(id).execute(&mut *tx).await?;
  sqlx::query("DELETE FROM student_interacao_social WHERE student_id = $1").bind(id).execute(&mut *tx).await?;
  sqlx::query("DELETE FROM student_locais_lazer WHERE student_id = $1").bind(id).execute(&mut *tx).await?;
  sqlx::query("DELETE FROM student_servicos_utilizados WHERE student_id = $1").bind(id).execute(&mut *tx).await?;

  for (idx, r) in draft.responsaveis_legais.iter().take(2).enumerate() {
    sqlx::query(
      r#"
        INSERT INTO student_responsaveis_legais (
          student_id, posicao, nome, data_nascimento, rg, cpf, celular, operadora, whatsapp, fixo, parentesco
        ) VALUES (
          $1, $2, $3, CAST($4 AS date), $5, $6, $7, $8, $9, $10, $11
        )
      "#,
    )
    .bind(id)
    .bind((idx + 1) as i16)
    .bind(none_if_blank(&r.nome))
    .bind(none_if_blank(&r.data_nascimento))
    .bind(none_if_blank(&r.rg))
    .bind(none_if_blank(&r.cpf))
    .bind(none_if_blank(&r.celular))
    .bind(none_if_blank(&r.operadora))
    .bind(none_if_blank(&r.whatsapp))
    .bind(none_if_blank(&r.fixo))
    .bind(none_if_blank(&r.parentesco))
    .execute(&mut *tx)
    .await?;
  }

  for m in &draft.membros_familiares {
    sqlx::query(
      "INSERT INTO student_membros_familiares (student_id, nome, parentesco, profissao, renda) VALUES ($1, $2, $3, $4, $5)",
    )
    .bind(id)
    .bind(none_if_blank(&m.nome))
    .bind(none_if_blank(&m.parentesco))
    .bind(none_if_blank(&m.profissao))
    .bind(none_if_blank(&m.renda))
    .execute(&mut *tx)
    .await?;
  }

  for p in &draft.pessoas_autorizadas {
    sqlx::query(
      "INSERT INTO student_pessoas_autorizadas (student_id, nome, documento, parentesco, telefone) VALUES ($1, $2, $3, $4, $5)",
    )
    .bind(id)
    .bind(none_if_blank(&p.nome))
    .bind(none_if_blank(&p.documento))
    .bind(none_if_blank(&p.parentesco))
    .bind(none_if_blank(&p.telefone))
    .execute(&mut *tx)
    .await?;
  }

  for b in &draft.beneficios {
    let v = b.trim();
    if v.is_empty() {
      continue;
    }
    sqlx::query("INSERT INTO student_beneficios (student_id, beneficio) VALUES ($1, $2) ON CONFLICT DO NOTHING")
      .bind(id)
      .bind(v)
      .execute(&mut *tx)
      .await?;
  }

  for v in &draft.interacao_social {
    let t = v.trim();
    if t.is_empty() {
      continue;
    }
    sqlx::query("INSERT INTO student_interacao_social (student_id, item) VALUES ($1, $2) ON CONFLICT DO NOTHING")
      .bind(id)
      .bind(t)
      .execute(&mut *tx)
      .await?;
  }

  for v in &draft.locais_lazer {
    let t = v.trim();
    if t.is_empty() {
      continue;
    }
    sqlx::query("INSERT INTO student_locais_lazer (student_id, item) VALUES ($1, $2) ON CONFLICT DO NOTHING")
      .bind(id)
      .bind(t)
      .execute(&mut *tx)
      .await?;
  }

  for v in &draft.servicos_utilizados {
    let t = v.trim();
    if t.is_empty() {
      continue;
    }
    sqlx::query("INSERT INTO student_servicos_utilizados (student_id, item) VALUES ($1, $2) ON CONFLICT DO NOTHING")
      .bind(id)
      .bind(t)
      .execute(&mut *tx)
      .await?;
  }

  tx.commit().await?;

  insert_audit_event(pool, id, &draft.nome_completo, "update", by_email).await?;

  Ok(Some(Student { id: id.to_string(), data: draft }))
}

pub async fn delete_student(pool: &PgPool, id: i64, by_email: &str) -> Result<bool, sqlx::Error> {
  let name: Option<String> = sqlx::query_scalar("SELECT nome_completo FROM students WHERE id = $1")
    .bind(id)
    .fetch_optional(pool)
    .await?;

  let Some(name) = name else { return Ok(false) };

  insert_audit_event(pool, id, &name, "delete", by_email).await?;

  let rows = sqlx::query("DELETE FROM students WHERE id = $1").bind(id).execute(pool).await?.rows_affected();
  Ok(rows > 0)
}

pub async fn list_audit_events(pool: &PgPool, limit: i64) -> Result<Vec<StudentAuditEvent>, sqlx::Error> {
  #[derive(sqlx::FromRow)]
  struct Row {
    id: i64,
    student_id: i64,
    student_name: String,
    action: String,
    at: String,
    by_email: String,
    changed_fields: Option<serde_json::Value>,
  }

  let rows: Vec<Row> = sqlx::query_as(
    r#"
      SELECT
        id,
        student_id,
        student_name,
        action,
        to_char(at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS at,
        by_email,
        changed_fields
      FROM student_audit_events
      ORDER BY at DESC, id DESC
      LIMIT $1
    "#,
  )
  .bind(limit)
  .fetch_all(pool)
  .await?;

  Ok(
    rows
      .into_iter()
      .map(|r| StudentAuditEvent {
        id: r.id.to_string(),
        student_id: r.student_id.to_string(),
        student_name: r.student_name,
        action: r.action,
        at: r.at,
        by_email: r.by_email,
        changed_fields: r
          .changed_fields
          .and_then(|v| serde_json::from_value::<Vec<String>>(v).ok()),
      })
      .collect(),
  )
}
