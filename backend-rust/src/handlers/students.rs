use axum::{
    extract::{Path, State},
    http::header,
    http::{HeaderMap, StatusCode},
    Json,
};
use chrono::Datelike;
use serde::Serialize;
use std::collections::HashSet;
use std::io::Cursor;

use crate::models::student::{Student, StudentAuditEvent, StudentDraft, StudentListItem};
use crate::routes::AppState;
use crate::services;

fn actor_email(headers: &HeaderMap) -> String {
    headers
        .get("x-user-email")
        .and_then(|v| v.to_str().ok())
        .map(|v| v.to_string())
        .unwrap_or_else(|| "desconhecido".to_string())
}

fn normalize_cpf(value: &str) -> String {
    value.chars().filter(|c| c.is_ascii_digit()).collect()
}

fn normalize_rg(value: &str) -> String {
    value.chars().filter(|c| c.is_ascii_digit()).collect()
}

fn normalize_livro(value: &str) -> String {
    value.trim().to_uppercase()
}

fn is_ascii_letters_spaces(value: &str) -> bool {
    let t = value.trim();
    if t.is_empty() {
        return true;
    }
    t.chars()
        .all(|c| c.is_alphabetic() || c == ' ' || c == '\'' || c == '-')
}

fn parse_iso_date(value: &str) -> Result<chrono::NaiveDate, (StatusCode, String)> {
    chrono::NaiveDate::parse_from_str(value, "%Y-%m-%d").map_err(|_| {
        (
            StatusCode::BAD_REQUEST,
            "Data inválida (use YYYY-MM-DD).".to_string(),
        )
    })
}

fn age_years(birth: chrono::NaiveDate, today: chrono::NaiveDate) -> i32 {
    let mut years = today.year() - birth.year();
    if (today.month(), today.day()) < (birth.month(), birth.day()) {
        years -= 1;
    }
    years as i32
}

async fn ensure_unique_student_field(
    pool: &sqlx::PgPool,
    field_label: &str,
    sql: &str,
    bind_value: &str,
    current_id: Option<i64>,
) -> Result<(), (StatusCode, String)> {
    let exists: Option<i64> = if let Some(id) = current_id {
        sqlx::query_scalar(sql)
            .bind(bind_value)
            .bind(id)
            .fetch_optional(pool)
            .await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
    } else {
        sqlx::query_scalar(sql)
            .bind(bind_value)
            .fetch_optional(pool)
            .await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
    };
    if exists.is_some() {
        return Err((
            StatusCode::CONFLICT,
            format!("Já existe um aluno cadastrado com este {field_label}."),
        ));
    }
    Ok(())
}

fn map_sqlx_error(e: sqlx::Error) -> (StatusCode, String) {
    if let sqlx::Error::Database(db) = &e {
        if let Some(code) = db.code() {
            match code.as_ref() {
                "23505" => {
                    let constraint = db.constraint().unwrap_or("");
                    let msg = match constraint {
                        "uq_students_cpf_digits" => "Já existe um aluno cadastrado com este CPF.",
                        "uq_students_rg_digits" => "Já existe um aluno cadastrado com este RG.",
                        "uq_students_certidao_termo" => {
                            "Já existe um aluno cadastrado com este Termo."
                        }
                        "uq_students_certidao_folha" => {
                            "Já existe um aluno cadastrado com esta Folha."
                        }
                        "uq_students_certidao_livro" => {
                            "Já existe um aluno cadastrado com este Livro."
                        }
                        _ => "Registro duplicado.",
                    };
                    return (StatusCode::CONFLICT, msg.to_string());
                }
                "23514" => return (StatusCode::BAD_REQUEST, "Dados inválidos.".to_string()),
                _ => {}
            }
        }
    }
    (StatusCode::INTERNAL_SERVER_ERROR, e.to_string())
}

pub async fn list_students(
    State(state): State<AppState>,
) -> Result<Json<Vec<StudentListItem>>, (StatusCode, String)> {
    let students = services::students_service::list_students(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    Ok(Json(students))
}

pub async fn get_student(
    Path(id): Path<String>,
    State(state): State<AppState>,
) -> Result<Json<Student>, (StatusCode, String)> {
    let id: i64 = id
        .parse()
        .map_err(|_| (StatusCode::BAD_REQUEST, "id inválido".to_string()))?;
    let student = services::students_service::get_student(&state.db, id)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    match student {
        Some(s) => Ok(Json(s)),
        None => Err((StatusCode::NOT_FOUND, "aluno não encontrado".to_string())),
    }
}

pub async fn create_student(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(mut payload): Json<StudentDraft>,
) -> Result<(StatusCode, Json<Student>), (StatusCode, String)> {
    let by_email = actor_email(&headers);

    payload.cpf = normalize_cpf(&payload.cpf);
    payload.rg = normalize_rg(&payload.rg);
    payload.certidao_termo = normalize_cpf(&payload.certidao_termo);
    payload.certidao_folha = normalize_cpf(&payload.certidao_folha);
    payload.certidao_livro = normalize_livro(&payload.certidao_livro);
    payload.cras_referencia = payload.cras_referencia.trim().to_string();
    payload.escola_professor = payload.escola_professor.trim().to_string();
    payload.escola_ano = payload.escola_ano.trim().to_string();
    payload.autorizacao_saida = payload.autorizacao_saida.trim().to_string();

    if !payload.autorizacao_saida.is_empty()
        && payload.autorizacao_saida != "sim"
        && payload.autorizacao_saida != "nao"
        && payload.autorizacao_saida != "somente-com-responsavel"
    {
        return Err((
            StatusCode::BAD_REQUEST,
            "Autorização de saída inválida.".to_string(),
        ));
    }
    if payload.autorizacao_saida.is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            "Autorização de saída é obrigatória.".to_string(),
        ));
    }

    if !payload.cras_referencia.is_empty() && payload.cras_referencia.chars().count() > 75 {
        return Err((
            StatusCode::BAD_REQUEST,
            "CRAS referência deve ter no máximo 75 caracteres.".to_string(),
        ));
    }

    if !payload.certidao_termo.is_empty() && payload.certidao_termo.len() != 7 {
        return Err((
            StatusCode::BAD_REQUEST,
            "Termo deve ter exatamente 7 dígitos.".to_string(),
        ));
    }
    if !payload.certidao_folha.is_empty() && payload.certidao_folha.len() != 3 {
        return Err((
            StatusCode::BAD_REQUEST,
            "Folha deve ter exatamente 3 dígitos.".to_string(),
        ));
    }
    if !payload.certidao_livro.is_empty() {
        if payload.certidao_livro.len() != 5
            || !payload
                .certidao_livro
                .chars()
                .all(|c| c.is_ascii_alphanumeric())
        {
            return Err((
                StatusCode::BAD_REQUEST,
                "Livro deve ter exatamente 5 caracteres (letras e números).".to_string(),
            ));
        }
    }

    if !is_ascii_letters_spaces(&payload.escola_professor) {
        return Err((
            StatusCode::BAD_REQUEST,
            "Professor deve conter apenas letras.".to_string(),
        ));
    }

    if !payload.escola_ano.is_empty() {
        let lower = payload.escola_ano.to_lowercase();
        let starts_digit = payload
            .escola_ano
            .chars()
            .next()
            .is_some_and(|c| c.is_ascii_digit());
        if !starts_digit || !lower.contains("ano") {
            return Err((
                StatusCode::BAD_REQUEST,
                "Ano escolar inválido. Ex: 2º ano, 3º ano do ensino médio.".to_string(),
            ));
        }
    }

    let cpf = payload.cpf.trim();
    if !cpf.is_empty() {
        ensure_unique_student_field(
      &state.db,
      "CPF",
      "SELECT id FROM students WHERE regexp_replace(coalesce(cpf, ''), '[^0-9]', '', 'g') = $1 LIMIT 1",
      cpf,
      None,
    )
    .await?;
    }

    let rg = payload.rg.trim();
    if !rg.is_empty() {
        ensure_unique_student_field(
      &state.db,
      "RG",
      "SELECT id FROM students WHERE regexp_replace(coalesce(rg, ''), '[^0-9]', '', 'g') = $1 LIMIT 1",
      rg,
      None,
    )
    .await?;
    }

    let termo = payload.certidao_termo.trim();
    if !termo.is_empty() {
        ensure_unique_student_field(
            &state.db,
            "Termo",
            "SELECT id FROM students WHERE certidao_termo = $1 LIMIT 1",
            termo,
            None,
        )
        .await?;
    }

    let folha = payload.certidao_folha.trim();
    if !folha.is_empty() {
        ensure_unique_student_field(
            &state.db,
            "Folha",
            "SELECT id FROM students WHERE certidao_folha = $1 LIMIT 1",
            folha,
            None,
        )
        .await?;
    }

    let livro = payload.certidao_livro.trim();
    if !livro.is_empty() {
        ensure_unique_student_field(
            &state.db,
            "Livro",
            "SELECT id FROM students WHERE certidao_livro = $1 LIMIT 1",
            livro,
            None,
        )
        .await?;
    }

    let mut seen_resp_cpf: HashSet<String> = HashSet::new();
    let student_cpf = payload.cpf.trim().to_string();
    let student_rg = payload.rg.trim().to_string();
    for r in payload.responsaveis_legais.iter_mut().take(2) {
        r.cpf = normalize_cpf(&r.cpf);
        r.rg = normalize_rg(&r.rg);
        let resp_cpf = r.cpf.trim();
        if resp_cpf.is_empty() {
            continue;
        }
        if !seen_resp_cpf.insert(resp_cpf.to_string()) {
            return Err((
                StatusCode::BAD_REQUEST,
                "O CPF de responsável está duplicado.".to_string(),
            ));
        }

        if !student_cpf.is_empty() && resp_cpf == student_cpf {
            return Err((
                StatusCode::BAD_REQUEST,
                "CPF do responsável não pode ser o CPF do aluno.".to_string(),
            ));
        }
        let resp_rg = r.rg.trim();
        if !student_rg.is_empty() && !resp_rg.is_empty() && resp_rg == student_rg {
            return Err((
                StatusCode::BAD_REQUEST,
                "RG do responsável não pode ser o RG do aluno.".to_string(),
            ));
        }

        let resp_is_student: Option<i64> = sqlx::query_scalar(
      "SELECT id FROM students WHERE regexp_replace(coalesce(cpf, ''), '[^0-9]', '', 'g') = $1 LIMIT 1",
    )
    .bind(resp_cpf)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
        if resp_is_student.is_some() {
            return Err((
                StatusCode::BAD_REQUEST,
                "CPF do responsável não pode ser CPF de aluno.".to_string(),
            ));
        }

        if !resp_rg.is_empty() {
            let rg_is_student: Option<i64> = sqlx::query_scalar(
        "SELECT id FROM students WHERE regexp_replace(coalesce(rg, ''), '[^0-9]', '', 'g') = $1 LIMIT 1",
      )
      .bind(resp_rg)
      .fetch_optional(&state.db)
      .await
      .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
            if rg_is_student.is_some() {
                return Err((
                    StatusCode::BAD_REQUEST,
                    "RG do responsável não pode ser RG de aluno.".to_string(),
                ));
            }
        }

        #[derive(sqlx::FromRow)]
        struct RespExistingRow {
            nome: Option<String>,
            data_nascimento: Option<String>,
            rg: Option<String>,
            celular: Option<String>,
            operadora: Option<String>,
            whatsapp: Option<String>,
            fixo: Option<String>,
            parentesco: Option<String>,
        }

        let existing = sqlx::query_as::<_, RespExistingRow>(
            r#"
        SELECT
          nome,
          to_char(data_nascimento, 'YYYY-MM-DD') AS data_nascimento,
          rg,
          celular,
          operadora,
          whatsapp,
          fixo,
          parentesco
        FROM student_responsaveis_legais
        WHERE regexp_replace(coalesce(cpf, ''), '[^0-9]', '', 'g') = $1
        ORDER BY id DESC
        LIMIT 1
      "#,
        )
        .bind(resp_cpf)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

        if let Some(ex) = existing {
            if r.nome.trim().is_empty() {
                r.nome = ex.nome.unwrap_or_default();
            }
            if r.data_nascimento.trim().is_empty() {
                r.data_nascimento = ex.data_nascimento.unwrap_or_default();
            }
            if r.rg.trim().is_empty() {
                r.rg = ex.rg.unwrap_or_default();
            }
            if r.celular.trim().is_empty() {
                r.celular = ex.celular.unwrap_or_default();
            }
            if r.operadora.trim().is_empty() {
                r.operadora = ex.operadora.unwrap_or_default();
            }
            if r.whatsapp.trim().is_empty() {
                r.whatsapp = ex.whatsapp.unwrap_or_default();
            }
            if r.fixo.trim().is_empty() {
                r.fixo = ex.fixo.unwrap_or_default();
            }
            if r.parentesco.trim().is_empty() {
                r.parentesco = ex.parentesco.unwrap_or_default();
            }
        }

        let dn = r.data_nascimento.trim();
        if !dn.is_empty() {
            let birth = parse_iso_date(dn)?;
            let today = chrono::Local::now().date_naive();
            if age_years(birth, today) < 18 {
                return Err((
                    StatusCode::BAD_REQUEST,
                    "Data de nascimento do responsável deve ser maior que 17 anos.".to_string(),
                ));
            }
        }
    }

    for p in payload.pessoas_autorizadas.iter_mut() {
        p.documento = normalize_cpf(&p.documento);
        let doc = p.documento.trim();
        if doc.is_empty() {
            continue;
        }
        if !student_cpf.is_empty() && doc == student_cpf {
            return Err((
                StatusCode::BAD_REQUEST,
                "CPF de pessoa autorizada não pode ser o CPF do aluno.".to_string(),
            ));
        }
        let exists_student: Option<i64> = sqlx::query_scalar(
      "SELECT id FROM students WHERE regexp_replace(coalesce(cpf, ''), '[^0-9]', '', 'g') = $1 LIMIT 1",
    )
    .bind(doc)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
        if exists_student.is_some() {
            return Err((
                StatusCode::BAD_REQUEST,
                "CPF de pessoa autorizada não pode ser CPF de aluno.".to_string(),
            ));
        }
    }

    let student = services::students_service::create_student(&state.db, payload, &by_email)
        .await
        .map_err(map_sqlx_error)?;
    Ok((StatusCode::CREATED, Json(student)))
}

pub async fn update_student(
    Path(id): Path<String>,
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(mut payload): Json<StudentDraft>,
) -> Result<Json<Student>, (StatusCode, String)> {
    let id: i64 = id
        .parse()
        .map_err(|_| (StatusCode::BAD_REQUEST, "id inválido".to_string()))?;
    let by_email = actor_email(&headers);

    payload.cpf = normalize_cpf(&payload.cpf);
    payload.rg = normalize_rg(&payload.rg);
    payload.certidao_termo = normalize_cpf(&payload.certidao_termo);
    payload.certidao_folha = normalize_cpf(&payload.certidao_folha);
    payload.certidao_livro = normalize_livro(&payload.certidao_livro);
    payload.cras_referencia = payload.cras_referencia.trim().to_string();
    payload.escola_professor = payload.escola_professor.trim().to_string();
    payload.escola_ano = payload.escola_ano.trim().to_string();
    payload.autorizacao_saida = payload.autorizacao_saida.trim().to_string();

    if !payload.autorizacao_saida.is_empty()
        && payload.autorizacao_saida != "sim"
        && payload.autorizacao_saida != "nao"
        && payload.autorizacao_saida != "somente-com-responsavel"
    {
        return Err((
            StatusCode::BAD_REQUEST,
            "Autorização de saída inválida.".to_string(),
        ));
    }
    if payload.autorizacao_saida.is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            "Autorização de saída é obrigatória.".to_string(),
        ));
    }

    if !payload.cras_referencia.is_empty() && payload.cras_referencia.chars().count() > 75 {
        return Err((
            StatusCode::BAD_REQUEST,
            "CRAS referência deve ter no máximo 75 caracteres.".to_string(),
        ));
    }

    if !payload.certidao_termo.is_empty() && payload.certidao_termo.len() != 7 {
        return Err((
            StatusCode::BAD_REQUEST,
            "Termo deve ter exatamente 7 dígitos.".to_string(),
        ));
    }
    if !payload.certidao_folha.is_empty() && payload.certidao_folha.len() != 3 {
        return Err((
            StatusCode::BAD_REQUEST,
            "Folha deve ter exatamente 3 dígitos.".to_string(),
        ));
    }
    if !payload.certidao_livro.is_empty() {
        if payload.certidao_livro.len() != 5
            || !payload
                .certidao_livro
                .chars()
                .all(|c| c.is_ascii_alphanumeric())
        {
            return Err((
                StatusCode::BAD_REQUEST,
                "Livro deve ter exatamente 5 caracteres (letras e números).".to_string(),
            ));
        }
    }

    if !is_ascii_letters_spaces(&payload.escola_professor) {
        return Err((
            StatusCode::BAD_REQUEST,
            "Professor deve conter apenas letras.".to_string(),
        ));
    }

    if !payload.escola_ano.is_empty() {
        let lower = payload.escola_ano.to_lowercase();
        let starts_digit = payload
            .escola_ano
            .chars()
            .next()
            .is_some_and(|c| c.is_ascii_digit());
        if !starts_digit || !lower.contains("ano") {
            return Err((
                StatusCode::BAD_REQUEST,
                "Ano escolar inválido. Ex: 2º ano, 3º ano do ensino médio.".to_string(),
            ));
        }
    }

    let cpf = payload.cpf.trim();
    if !cpf.is_empty() {
        ensure_unique_student_field(
            &state.db,
            "CPF",
            r#"
        SELECT id
        FROM students
        WHERE regexp_replace(coalesce(cpf, ''), '[^0-9]', '', 'g') = $1
          AND id <> $2
        LIMIT 1
      "#,
            cpf,
            Some(id),
        )
        .await?;
    }

    let rg = payload.rg.trim();
    if !rg.is_empty() {
        ensure_unique_student_field(
            &state.db,
            "RG",
            r#"
        SELECT id
        FROM students
        WHERE regexp_replace(coalesce(rg, ''), '[^0-9]', '', 'g') = $1
          AND id <> $2
        LIMIT 1
      "#,
            rg,
            Some(id),
        )
        .await?;
    }

    let termo = payload.certidao_termo.trim();
    if !termo.is_empty() {
        ensure_unique_student_field(
            &state.db,
            "Termo",
            "SELECT id FROM students WHERE certidao_termo = $1 AND id <> $2 LIMIT 1",
            termo,
            Some(id),
        )
        .await?;
    }

    let folha = payload.certidao_folha.trim();
    if !folha.is_empty() {
        ensure_unique_student_field(
            &state.db,
            "Folha",
            "SELECT id FROM students WHERE certidao_folha = $1 AND id <> $2 LIMIT 1",
            folha,
            Some(id),
        )
        .await?;
    }

    let livro = payload.certidao_livro.trim();
    if !livro.is_empty() {
        ensure_unique_student_field(
            &state.db,
            "Livro",
            "SELECT id FROM students WHERE certidao_livro = $1 AND id <> $2 LIMIT 1",
            livro,
            Some(id),
        )
        .await?;
    }

    let mut seen_resp_cpf: HashSet<String> = HashSet::new();
    let student_cpf = payload.cpf.trim().to_string();
    let student_rg = payload.rg.trim().to_string();
    for r in payload.responsaveis_legais.iter_mut().take(2) {
        r.cpf = normalize_cpf(&r.cpf);
        r.rg = normalize_rg(&r.rg);
        let resp_cpf = r.cpf.trim();
        if resp_cpf.is_empty() {
            continue;
        }
        if !seen_resp_cpf.insert(resp_cpf.to_string()) {
            return Err((
                StatusCode::BAD_REQUEST,
                "O CPF de responsável está duplicado.".to_string(),
            ));
        }

        if !student_cpf.is_empty() && resp_cpf == student_cpf {
            return Err((
                StatusCode::BAD_REQUEST,
                "CPF do responsável não pode ser o CPF do aluno.".to_string(),
            ));
        }
        let resp_rg = r.rg.trim();
        if !student_rg.is_empty() && !resp_rg.is_empty() && resp_rg == student_rg {
            return Err((
                StatusCode::BAD_REQUEST,
                "RG do responsável não pode ser o RG do aluno.".to_string(),
            ));
        }

        let resp_is_student: Option<i64> = sqlx::query_scalar(
            r#"
        SELECT id
        FROM students
        WHERE regexp_replace(coalesce(cpf, ''), '[^0-9]', '', 'g') = $1
          AND id <> $2
        LIMIT 1
      "#,
        )
        .bind(resp_cpf)
        .bind(id)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
        if resp_is_student.is_some() {
            return Err((
                StatusCode::BAD_REQUEST,
                "CPF do responsável não pode ser CPF de aluno.".to_string(),
            ));
        }

        if !resp_rg.is_empty() {
            let rg_is_student: Option<i64> = sqlx::query_scalar(
                r#"
          SELECT id
          FROM students
          WHERE regexp_replace(coalesce(rg, ''), '[^0-9]', '', 'g') = $1
            AND id <> $2
          LIMIT 1
        "#,
            )
            .bind(resp_rg)
            .bind(id)
            .fetch_optional(&state.db)
            .await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
            if rg_is_student.is_some() {
                return Err((
                    StatusCode::BAD_REQUEST,
                    "RG do responsável não pode ser RG de aluno.".to_string(),
                ));
            }
        }

        #[derive(sqlx::FromRow)]
        struct RespExistingRow {
            nome: Option<String>,
            data_nascimento: Option<String>,
            rg: Option<String>,
            celular: Option<String>,
            operadora: Option<String>,
            whatsapp: Option<String>,
            fixo: Option<String>,
            parentesco: Option<String>,
        }

        let existing = sqlx::query_as::<_, RespExistingRow>(
            r#"
        SELECT
          nome,
          to_char(data_nascimento, 'YYYY-MM-DD') AS data_nascimento,
          rg,
          celular,
          operadora,
          whatsapp,
          fixo,
          parentesco
        FROM student_responsaveis_legais
        WHERE regexp_replace(coalesce(cpf, ''), '[^0-9]', '', 'g') = $1
        ORDER BY id DESC
        LIMIT 1
      "#,
        )
        .bind(resp_cpf)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

        if let Some(ex) = existing {
            if r.nome.trim().is_empty() {
                r.nome = ex.nome.unwrap_or_default();
            }
            if r.data_nascimento.trim().is_empty() {
                r.data_nascimento = ex.data_nascimento.unwrap_or_default();
            }
            if r.rg.trim().is_empty() {
                r.rg = ex.rg.unwrap_or_default();
            }
            if r.celular.trim().is_empty() {
                r.celular = ex.celular.unwrap_or_default();
            }
            if r.operadora.trim().is_empty() {
                r.operadora = ex.operadora.unwrap_or_default();
            }
            if r.whatsapp.trim().is_empty() {
                r.whatsapp = ex.whatsapp.unwrap_or_default();
            }
            if r.fixo.trim().is_empty() {
                r.fixo = ex.fixo.unwrap_or_default();
            }
            if r.parentesco.trim().is_empty() {
                r.parentesco = ex.parentesco.unwrap_or_default();
            }
        }

        let dn = r.data_nascimento.trim();
        if !dn.is_empty() {
            let birth = parse_iso_date(dn)?;
            let today = chrono::Local::now().date_naive();
            if age_years(birth, today) < 18 {
                return Err((
                    StatusCode::BAD_REQUEST,
                    "Data de nascimento do responsável deve ser maior que 17 anos.".to_string(),
                ));
            }
        }
    }

    for p in payload.pessoas_autorizadas.iter_mut() {
        p.documento = normalize_cpf(&p.documento);
        let doc = p.documento.trim();
        if doc.is_empty() {
            continue;
        }
        if !student_cpf.is_empty() && doc == student_cpf {
            return Err((
                StatusCode::BAD_REQUEST,
                "CPF de pessoa autorizada não pode ser o CPF do aluno.".to_string(),
            ));
        }
        let exists_student: Option<i64> = sqlx::query_scalar(
            r#"
        SELECT id
        FROM students
        WHERE regexp_replace(coalesce(cpf, ''), '[^0-9]', '', 'g') = $1
          AND id <> $2
        LIMIT 1
      "#,
        )
        .bind(doc)
        .bind(id)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
        if exists_student.is_some() {
            return Err((
                StatusCode::BAD_REQUEST,
                "CPF de pessoa autorizada não pode ser CPF de aluno.".to_string(),
            ));
        }
    }

    let updated = services::students_service::update_student(&state.db, id, payload, &by_email)
        .await
        .map_err(map_sqlx_error)?;

    match updated {
        Some(s) => Ok(Json(s)),
        None => Err((StatusCode::NOT_FOUND, "aluno não encontrado".to_string())),
    }
}

pub async fn delete_student(
    Path(id): Path<String>,
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<StatusCode, (StatusCode, String)> {
    let id: i64 = id
        .parse()
        .map_err(|_| (StatusCode::BAD_REQUEST, "id inválido".to_string()))?;
    let by_email = actor_email(&headers);
    let deleted = services::students_service::delete_student(&state.db, id, &by_email)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    if deleted {
        Ok(StatusCode::NO_CONTENT)
    } else {
        Err((StatusCode::NOT_FOUND, "aluno não encontrado".to_string()))
    }
}

pub async fn list_audit_events(
    State(state): State<AppState>,
) -> Result<Json<Vec<StudentAuditEvent>>, (StatusCode, String)> {
    let events = services::students_service::list_audit_events(&state.db, 1000)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    Ok(Json(events))
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StudentsStatsResponse {
    pub total_students: i64,
    pub schools: i64,
    pub this_month: i64,
}

pub async fn get_students_stats(
    State(state): State<AppState>,
) -> Result<Json<StudentsStatsResponse>, (StatusCode, String)> {
    let (total_students, schools, this_month) =
        services::students_service::get_students_stats(&state.db)
            .await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    Ok(Json(StudentsStatsResponse {
        total_students,
        schools,
        this_month,
    }))
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminStatsResponse {
    pub approved_accounts: i64,
    pub pending_accounts: i64,
    pub alunos_adicionados: i64,
    pub alteracoes_em_alunos: i64,
}

pub async fn get_admin_stats(
    State(state): State<AppState>,
) -> Result<Json<AdminStatsResponse>, (StatusCode, String)> {
    let (approved_accounts, pending_accounts, alunos_adicionados, alteracoes_em_alunos) =
        services::students_service::get_admin_stats(&state.db)
            .await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(AdminStatsResponse {
        approved_accounts,
        pending_accounts,
        alunos_adicionados,
        alteracoes_em_alunos,
    }))
}

fn sanitize_filename_part(value: &str) -> String {
    let mut out = String::with_capacity(value.len());
    for ch in value.chars() {
        if matches!(ch, '<' | '>' | ':' | '"' | '/' | '\\' | '|' | '?' | '*') {
            continue;
        }
        out.push(ch);
    }
    out.trim().to_string()
}

fn build_contract_filename(student_nome: &str, student_cpf: &str) -> String {
    let date = chrono::Local::now().format("%Y-%m-%d").to_string();
    let first_name = student_nome.split_whitespace().next().unwrap_or("Aluno");
    let cpf = student_cpf.trim();
    format!(
        "{} {} - {}.pdf",
        sanitize_filename_part(&date),
        sanitize_filename_part(first_name),
        sanitize_filename_part(cpf)
    )
}

fn generate_contract_pdf(student: &Student) -> Result<Vec<u8>, String> {
    let required = std::env::var("CONTRACT_TEMPLATE_REQUIRED")
        .ok()
        .map(|v| matches!(v.trim().to_ascii_lowercase().as_str(), "1" | "true" | "yes"))
        .unwrap_or(false);
    if required {
        return generate_contract_pdf_from_template(student);
    }
    generate_contract_pdf_from_template(student).or_else(|_| generate_simple_contract_pdf(student))
}

fn contract_template_dirs() -> Vec<String> {
    let mut dirs = Vec::new();
    if let Ok(dir) = std::env::var("CONTRACT_TEMPLATE_DIR") {
        if !dir.trim().is_empty() {
            dirs.push(dir);
        }
    }
    dirs.push("docs/forms information".to_string());
    dirs.push("../docs/forms information".to_string());
    dirs.push("../../docs/forms information".to_string());
    dirs
}

fn load_contract_template_images() -> Result<Vec<Vec<u8>>, String> {
    let dirs = contract_template_dirs();
    let mut pages = Vec::new();
    for idx in 1..=8 {
        let filename = format!("{idx}.jpeg");
        let bytes = dirs
            .iter()
            .find_map(|dir| std::fs::read(std::path::Path::new(dir).join(&filename)).ok())
            .ok_or_else(|| format!("template não encontrado: {filename}"))?;
        pages.push(bytes);
    }
    Ok(pages)
}

fn generate_contract_pdf_from_template(student: &Student) -> Result<Vec<u8>, String> {
    use printpdf::image_crate::GenericImageView;
    use printpdf::{
        BuiltinFont, Image, ImageTransform, Line, Mm, PdfDocument, PdfLayerReference, Point,
    };

    let templates = load_contract_template_images()?;

    let page_w: f32 = 210.0;
    let page_h: f32 = 297.0;
    let (doc, page1, layer1) = PdfDocument::new("Contrato", Mm(page_w), Mm(page_h), "Page 1");
    let mut layers: Vec<PdfLayerReference> = Vec::with_capacity(templates.len());
    layers.push(doc.get_page(page1).get_layer(layer1));
    for page_idx in 2..=templates.len() {
        let (page, layer) = doc.add_page(Mm(page_w), Mm(page_h), format!("Page {page_idx}"));
        layers.push(doc.get_page(page).get_layer(layer));
    }

    let font = doc
        .add_builtin_font(BuiltinFont::Helvetica)
        .map_err(|e| e.to_string())?;
    let font_bold = doc
        .add_builtin_font(BuiltinFont::HelveticaBold)
        .map_err(|e| e.to_string())?;

    let add_background = |layer: &PdfLayerReference, bytes: &[u8]| -> Result<(), String> {
        let img = printpdf::image_crate::load_from_memory(bytes).map_err(|e| e.to_string())?;
        let (w_px, h_px) = img.dimensions();
        let assumed_dpi: f32 = 300.0;
        let w_mm = (w_px as f32 / assumed_dpi) * 25.4;
        let h_mm = (h_px as f32 / assumed_dpi) * 25.4;
        let scale = (page_w / w_mm).min(page_h / h_mm);
        let used_w = w_mm * scale;
        let used_h = h_mm * scale;
        let x = (page_w - used_w) / 2.0;
        let y = (page_h - used_h) / 2.0;
        let pdf_img = Image::from_dynamic_image(&img);
        pdf_img.add_to_layer(
            layer.clone(),
            ImageTransform {
                translate_x: Some(Mm(x)),
                translate_y: Some(Mm(y)),
                rotate: None,
                scale_x: Some(scale),
                scale_y: Some(scale),
                dpi: Some(assumed_dpi),
            },
        );
        Ok(())
    };

    for (idx, bytes) in templates.iter().enumerate() {
        add_background(&layers[idx], bytes)?;
    }

    let approx_max_chars = |text: &str, max_width_mm: f32, font_size: f32| -> String {
        let text = text.trim();
        if text.is_empty() {
            return String::new();
        }
        let char_w_mm = (font_size * 0.35).max(0.1);
        let max_chars = (max_width_mm / char_w_mm).floor().max(1.0) as usize;
        if text.chars().count() <= max_chars {
            return text.to_string();
        }
        let mut out = String::with_capacity(max_chars);
        for (i, ch) in text.chars().enumerate() {
            if i + 1 >= max_chars {
                break;
            }
            out.push(ch);
        }
        out.push('…');
        out
    };

    let write = |layer: &PdfLayerReference,
                 text: &str,
                 font_size: f32,
                 x: f32,
                 y: f32,
                 bold: bool,
                 max_width_mm: Option<f32>| {
        let value = match max_width_mm {
            Some(w) => approx_max_chars(text, w, font_size),
            None => text.trim().to_string(),
        };
        if value.is_empty() {
            return;
        }
        layer.use_text(
            value,
            font_size,
            Mm(x),
            Mm(y),
            if bold { &font_bold } else { &font },
        );
    };

    let draw_x = |layer: &PdfLayerReference, x: f32, y: f32, size: f32| {
        let l1 = Line::from_iter(vec![
            (Point::new(Mm(x), Mm(y)), false),
            (Point::new(Mm(x + size), Mm(y + size)), false),
        ]);
        layer.add_line(l1);
        let l2 = Line::from_iter(vec![
            (Point::new(Mm(x), Mm(y + size)), false),
            (Point::new(Mm(x + size), Mm(y)), false),
        ]);
        layer.add_line(l2);
    };

    let page1 = &layers[0];
    write(
        page1,
        &student.data.nome_completo,
        10.0,
        28.0,
        246.0,
        false,
        Some(150.0),
    );
    write(
        page1,
        &student.data.data_nascimento,
        10.0,
        150.0,
        246.0,
        false,
        Some(35.0),
    );
    if let Some(idade) = student.data.idade {
        write(
            page1,
            &idade.to_string(),
            10.0,
            186.0,
            246.0,
            false,
            Some(18.0),
        );
    }
    write(
        page1,
        &student.data.cpf,
        10.0,
        150.0,
        238.0,
        false,
        Some(45.0),
    );
    write(
        page1,
        &student.data.rg,
        10.0,
        28.0,
        238.0,
        false,
        Some(60.0),
    );
    write(
        page1,
        &student.data.nis,
        10.0,
        28.0,
        230.0,
        false,
        Some(60.0),
    );
    write(
        page1,
        &student.data.naturalidade,
        10.0,
        28.0,
        222.0,
        false,
        Some(90.0),
    );
    write(
        page1,
        &student.data.raca_cor,
        10.0,
        122.0,
        222.0,
        false,
        Some(70.0),
    );

    let sexo_lower = student.data.sexo.trim().to_ascii_lowercase();
    if !sexo_lower.is_empty() {
        if sexo_lower.starts_with('m') {
            draw_x(page1, 181.0, 221.5, 3.0);
        } else if sexo_lower.starts_with('f') {
            draw_x(page1, 194.0, 221.5, 3.0);
        } else {
            write(
                page1,
                &student.data.sexo,
                10.0,
                175.0,
                222.0,
                false,
                Some(30.0),
            );
        }
    }

    write(
        page1,
        &student.data.certidao_termo,
        10.0,
        28.0,
        214.0,
        false,
        Some(30.0),
    );
    write(
        page1,
        &student.data.certidao_folha,
        10.0,
        63.0,
        214.0,
        false,
        Some(30.0),
    );
    write(
        page1,
        &student.data.certidao_livro,
        10.0,
        98.0,
        214.0,
        false,
        Some(30.0),
    );

    write(
        page1,
        &student.data.endereco_cep,
        10.0,
        150.0,
        214.0,
        false,
        Some(45.0),
    );
    write(
        page1,
        &student.data.endereco_logradouro,
        10.0,
        28.0,
        206.0,
        false,
        Some(120.0),
    );
    write(
        page1,
        &student.data.endereco_numero,
        10.0,
        150.0,
        206.0,
        false,
        Some(20.0),
    );
    write(
        page1,
        &student.data.endereco_complemento,
        10.0,
        175.0,
        206.0,
        false,
        Some(35.0),
    );
    write(
        page1,
        &student.data.endereco_bairro,
        10.0,
        28.0,
        198.0,
        false,
        Some(80.0),
    );
    write(
        page1,
        &student.data.endereco_cidade,
        10.0,
        115.0,
        198.0,
        false,
        Some(60.0),
    );
    write(
        page1,
        &student.data.endereco_uf,
        10.0,
        182.0,
        198.0,
        false,
        Some(10.0),
    );

    write(
        page1,
        &student.data.nome_pai,
        10.0,
        28.0,
        190.0,
        false,
        Some(85.0),
    );
    write(
        page1,
        &student.data.nome_mae,
        10.0,
        115.0,
        190.0,
        false,
        Some(85.0),
    );
    write(
        page1,
        &student.data.cras_referencia,
        10.0,
        28.0,
        182.0,
        false,
        Some(80.0),
    );

    if layers.len() >= 2 {
        let page2 = &layers[1];
        if let Some(r1) = student.data.responsaveis_legais.get(0) {
            write(page2, &r1.nome, 10.0, 28.0, 255.0, false, Some(120.0));
            write(page2, &r1.cpf, 10.0, 28.0, 247.0, false, Some(50.0));
            write(page2, &r1.rg, 10.0, 88.0, 247.0, false, Some(50.0));
            write(
                page2,
                &r1.data_nascimento,
                10.0,
                150.0,
                247.0,
                false,
                Some(35.0),
            );
            write(page2, &r1.celular, 10.0, 28.0, 239.0, false, Some(55.0));
            write(page2, &r1.parentesco, 10.0, 88.0, 239.0, false, Some(60.0));
        }
        if let Some(r2) = student.data.responsaveis_legais.get(1) {
            write(page2, &r2.nome, 10.0, 28.0, 225.0, false, Some(120.0));
            write(page2, &r2.cpf, 10.0, 28.0, 217.0, false, Some(50.0));
            write(page2, &r2.rg, 10.0, 88.0, 217.0, false, Some(50.0));
            write(
                page2,
                &r2.data_nascimento,
                10.0,
                150.0,
                217.0,
                false,
                Some(35.0),
            );
            write(page2, &r2.celular, 10.0, 28.0, 209.0, false, Some(55.0));
            write(page2, &r2.parentesco, 10.0, 88.0, 209.0, false, Some(60.0));
        }
    }

    let buf = Cursor::new(Vec::<u8>::new());
    let mut writer = std::io::BufWriter::new(buf);
    doc.save(&mut writer).map_err(|e| e.to_string())?;
    let cursor = writer.into_inner().map_err(|e| e.to_string())?;
    Ok(cursor.into_inner())
}

fn generate_simple_contract_pdf(student: &Student) -> Result<Vec<u8>, String> {
    use printpdf::{BuiltinFont, Image, ImageTransform, Line, Mm, PdfDocument, Point};

    let title = "Sementes do Amanhã - Contrato de Matrícula";
    let (doc, page1, layer1) = PdfDocument::new("Contrato", Mm(210.0), Mm(297.0), "Layer 1");
    let layer = doc.get_page(page1).get_layer(layer1);

    let font = doc
        .add_builtin_font(BuiltinFont::Helvetica)
        .map_err(|e| e.to_string())?;
    let font_bold = doc
        .add_builtin_font(BuiltinFont::HelveticaBold)
        .map_err(|e| e.to_string())?;

    let logo_path = std::env::var("CONTRACT_LOGO_PATH").ok();
    let logo_candidates = [
        logo_path.as_deref(),
        Some("frontend/src/assets/logo.png"),
        Some("../frontend/src/assets/logo.png"),
    ];
    let logo_bytes = logo_candidates
        .into_iter()
        .flatten()
        .find_map(|p| std::fs::read(p).ok());
    if let Some(bytes) = logo_bytes {
        if let Ok(img) = printpdf::image_crate::load_from_memory(&bytes) {
            let pdf_img = Image::from_dynamic_image(&img);
            pdf_img.add_to_layer(
                layer.clone(),
                ImageTransform {
                    translate_x: Some(Mm(20.0)),
                    translate_y: Some(Mm(275.0)),
                    rotate: None,
                    scale_x: Some(0.18),
                    scale_y: Some(0.18),
                    dpi: Some(300.0),
                },
            );
        }
    }

    layer.use_text(title, 18.0, Mm(60.0), Mm(285.0), &font_bold);
    layer.use_text(
        format!("Aluno: {}", student.data.nome_completo),
        12.0,
        Mm(60.0),
        Mm(274.0),
        &font,
    );

    let mut y: f32 = 262.0;
    let x_label: f32 = 20.0;
    let x_value: f32 = 70.0;

    let row = |y: &mut f32, label: &str, value: &str| {
        if value.trim().is_empty() {
            return;
        }
        layer.use_text(format!("{label}:"), 10.0, Mm(x_label), Mm(*y), &font_bold);
        layer.use_text(value, 10.0, Mm(x_value), Mm(*y), &font);
        *y -= 7.0;
    };

    row(&mut y, "CPF", &student.data.cpf);
    row(&mut y, "RG", &student.data.rg);
    row(&mut y, "NIS", &student.data.nis);
    row(&mut y, "Nascimento", &student.data.data_nascimento);
    if let Some(idade) = student.data.idade {
        row(&mut y, "Idade", &idade.to_string());
    }
    row(&mut y, "Sexo", &student.data.sexo);
    row(&mut y, "Naturalidade", &student.data.naturalidade);
    row(&mut y, "Raça/Cor", &student.data.raca_cor);

    y -= 3.0;
    row(&mut y, "Endereço CEP", &student.data.endereco_cep);
    row(&mut y, "Logradouro", &student.data.endereco_logradouro);
    row(&mut y, "Número", &student.data.endereco_numero);
    row(&mut y, "Complemento", &student.data.endereco_complemento);
    row(&mut y, "Bairro", &student.data.endereco_bairro);
    row(&mut y, "Cidade", &student.data.endereco_cidade);
    row(&mut y, "UF", &student.data.endereco_uf);

    y -= 3.0;
    row(&mut y, "Nome do pai", &student.data.nome_pai);
    row(&mut y, "Nome da mãe", &student.data.nome_mae);
    row(&mut y, "CRAS", &student.data.cras_referencia);
    row(&mut y, "Escola", &student.data.escola_nome);
    row(&mut y, "Série", &student.data.escola_serie);
    row(&mut y, "Ano", &student.data.escola_ano);
    row(&mut y, "Professor(a)", &student.data.escola_professor);
    row(&mut y, "Período", &student.data.escola_periodo);

    y -= 3.0;
    if let Some(r1) = student.data.responsaveis_legais.get(0) {
        row(&mut y, "Responsável (nome)", &r1.nome);
        row(&mut y, "Responsável (CPF)", &r1.cpf);
        row(&mut y, "Responsável (telefone)", &r1.celular);
    }

    let school_name = std::env::var("SCHOOL_RESPONSIBLE_NAME")
        .unwrap_or_else(|_| "Responsável da escola".to_string());
    let school_cpf = std::env::var("SCHOOL_RESPONSIBLE_CPF").unwrap_or_default();

    let y_sig = 40.0;

    let line1 = Line::from_iter(vec![
        (Point::new(Mm(20.0), Mm(y_sig)), false),
        (Point::new(Mm(95.0), Mm(y_sig)), false),
    ]);
    layer.add_line(line1);
    layer.use_text(
        format!(
            "Responsável (CPF: {})",
            student
                .data
                .responsaveis_legais
                .get(0)
                .map(|r| r.cpf.as_str())
                .unwrap_or("")
        ),
        9.0,
        Mm(20.0),
        Mm(y_sig - 6.0),
        &font,
    );

    let line2 = Line::from_iter(vec![
        (Point::new(Mm(115.0), Mm(y_sig)), false),
        (Point::new(Mm(190.0), Mm(y_sig)), false),
    ]);
    layer.add_line(line2);
    layer.use_text(
        format!("{} (CPF: {})", school_name, school_cpf),
        9.0,
        Mm(115.0),
        Mm(y_sig - 6.0),
        &font,
    );

    let buf = Cursor::new(Vec::<u8>::new());
    let mut writer = std::io::BufWriter::new(buf);
    doc.save(&mut writer).map_err(|e| e.to_string())?;
    let cursor = writer.into_inner().map_err(|e| e.to_string())?;
    Ok(cursor.into_inner())
}

pub async fn download_student_contract(
    Path(id): Path<String>,
    State(state): State<AppState>,
) -> Result<axum::response::Response, (StatusCode, String)> {
    let id: i64 = id
        .parse()
        .map_err(|_| (StatusCode::BAD_REQUEST, "id inválido".to_string()))?;
    let student = services::students_service::get_student(&state.db, id)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((StatusCode::NOT_FOUND, "aluno não encontrado".to_string()))?;

    let pdf_bytes =
        generate_contract_pdf(&student).map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))?;
    let filename = build_contract_filename(&student.data.nome_completo, &student.data.cpf);

    let storage_dir =
        std::env::var("CONTRACTS_DIR").unwrap_or_else(|_| "storage/contracts".to_string());
    let path = std::path::Path::new(&storage_dir);
    tokio::fs::create_dir_all(path)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    let full_path = path.join(&filename);
    tokio::fs::write(&full_path, &pdf_bytes)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let mut res = axum::response::Response::new(axum::body::Body::from(pdf_bytes));
    *res.status_mut() = StatusCode::OK;
    let headers = res.headers_mut();
    headers.insert(
        header::CONTENT_TYPE,
        header::HeaderValue::from_static("application/pdf"),
    );
    headers.insert(
        header::CONTENT_DISPOSITION,
        header::HeaderValue::from_str(&format!("attachment; filename=\"{}\"", filename))
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?,
    );
    Ok(res)
}
