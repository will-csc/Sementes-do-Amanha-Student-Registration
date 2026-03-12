use axum::{
  extract::{Path, State},
  http::header,
  http::{HeaderMap, StatusCode},
  Json,
};
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

pub async fn list_students(State(state): State<AppState>) -> Result<Json<Vec<StudentListItem>>, (StatusCode, String)> {
  let students = services::students_service::list_students(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
  Ok(Json(students))
}

pub async fn get_student(Path(id): Path<String>, State(state): State<AppState>) -> Result<Json<Student>, (StatusCode, String)> {
  let id: i64 = id.parse().map_err(|_| (StatusCode::BAD_REQUEST, "id inválido".to_string()))?;
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
  let cpf = payload.cpf.trim();
  if !cpf.is_empty() {
    let existing_id: Option<i64> = sqlx::query_scalar(
      "SELECT id FROM students WHERE regexp_replace(coalesce(cpf, ''), '[^0-9]', '', 'g') = $1 LIMIT 1",
    )
      .bind(cpf)
      .fetch_optional(&state.db)
      .await
      .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    if existing_id.is_some() {
      return Err((StatusCode::CONFLICT, "Já existe um aluno cadastrado com este CPF.".to_string()));
    }
  }

  let mut seen_resp_cpf: HashSet<String> = HashSet::new();
  for r in payload.responsaveis_legais.iter_mut().take(2) {
    r.cpf = normalize_cpf(&r.cpf);
    let resp_cpf = r.cpf.trim();
    if resp_cpf.is_empty() {
      continue;
    }
    if !seen_resp_cpf.insert(resp_cpf.to_string()) {
      return Err((StatusCode::BAD_REQUEST, "O CPF de responsável está duplicado.".to_string()));
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
  }

  let student = services::students_service::create_student(&state.db, payload, &by_email)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
  Ok((StatusCode::CREATED, Json(student)))
}

pub async fn update_student(
  Path(id): Path<String>,
  State(state): State<AppState>,
  headers: HeaderMap,
  Json(mut payload): Json<StudentDraft>,
) -> Result<Json<Student>, (StatusCode, String)> {
  let id: i64 = id.parse().map_err(|_| (StatusCode::BAD_REQUEST, "id inválido".to_string()))?;
  let by_email = actor_email(&headers);

  payload.cpf = normalize_cpf(&payload.cpf);
  let cpf = payload.cpf.trim();
  if !cpf.is_empty() {
    let existing_id: Option<i64> = sqlx::query_scalar(
      r#"
        SELECT id
        FROM students
        WHERE regexp_replace(coalesce(cpf, ''), '[^0-9]', '', 'g') = $1
          AND id <> $2
        LIMIT 1
      "#,
    )
    .bind(cpf)
    .bind(id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    if existing_id.is_some() {
      return Err((StatusCode::CONFLICT, "Já existe um aluno cadastrado com este CPF.".to_string()));
    }
  }

  let mut seen_resp_cpf: HashSet<String> = HashSet::new();
  for r in payload.responsaveis_legais.iter_mut().take(2) {
    r.cpf = normalize_cpf(&r.cpf);
    let resp_cpf = r.cpf.trim();
    if resp_cpf.is_empty() {
      continue;
    }
    if !seen_resp_cpf.insert(resp_cpf.to_string()) {
      return Err((StatusCode::BAD_REQUEST, "O CPF de responsável está duplicado.".to_string()));
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
  }

  let updated = services::students_service::update_student(&state.db, id, payload, &by_email)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

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
  let id: i64 = id.parse().map_err(|_| (StatusCode::BAD_REQUEST, "id inválido".to_string()))?;
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

pub async fn list_audit_events(State(state): State<AppState>) -> Result<Json<Vec<StudentAuditEvent>>, (StatusCode, String)> {
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

pub async fn get_students_stats(State(state): State<AppState>) -> Result<Json<StudentsStatsResponse>, (StatusCode, String)> {
  let (total_students, schools, this_month) = services::students_service::get_students_stats(&state.db)
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

pub async fn get_admin_stats(State(state): State<AppState>) -> Result<Json<AdminStatsResponse>, (StatusCode, String)> {
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

  let school_name = std::env::var("SCHOOL_RESPONSIBLE_NAME").unwrap_or_else(|_| "Responsável da escola".to_string());
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
  let id: i64 = id.parse().map_err(|_| (StatusCode::BAD_REQUEST, "id inválido".to_string()))?;
  let student = services::students_service::get_student(&state.db, id)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
    .ok_or((StatusCode::NOT_FOUND, "aluno não encontrado".to_string()))?;

  let pdf_bytes = generate_contract_pdf(&student).map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))?;
  let filename = build_contract_filename(&student.data.nome_completo, &student.data.cpf);

  let storage_dir = std::env::var("CONTRACTS_DIR").unwrap_or_else(|_| "storage/contracts".to_string());
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
  headers.insert(header::CONTENT_TYPE, header::HeaderValue::from_static("application/pdf"));
  headers.insert(
    header::CONTENT_DISPOSITION,
    header::HeaderValue::from_str(&format!("attachment; filename=\"{}\"", filename)).map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?,
  );
  Ok(res)
}
