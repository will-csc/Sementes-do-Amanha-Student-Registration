use axum::{
    extract::Path,
    http::{
        header::{self, HeaderValue},
        StatusCode,
    },
    Json,
};
use chrono::Datelike;
use serde::Serialize;
use serde_json::Value;
use std::{
    collections::BTreeMap,
    io::{Cursor, Read, Write},
    path::{Path as StdPath, PathBuf},
};
use zip::{write::FileOptions, CompressionMethod, ZipArchive, ZipWriter};

#[derive(Clone, Copy)]
struct DocumentDefinition {
    slug: &'static str,
    label: &'static str,
    filename: &'static str,
}

const DOCUMENTS: [DocumentDefinition; 4] = [
    DocumentDefinition {
        slug: "ficha_acolhimento",
        label: "Ficha de Acolhimento",
        filename: "ficha_de_acolhimento.docx",
    },
    DocumentDefinition {
        slug: "termo_autorizacao_saida",
        label: "Termo de Autorizacao de Saida Desacompanhada",
        filename: "termo_de_autorizacao_saida_desacompanhada.docx",
    },
    DocumentDefinition {
        slug: "termo_responsabilidade",
        label: "Termo de Responsabilidade",
        filename: "termo_de_responsabilidade.docx",
    },
    DocumentDefinition {
        slug: "termo_uso_imagem",
        label: "Termo de Uso de Imagem",
        filename: "termo_uso_de_imagem.docx",
    },
];

#[derive(Serialize)]
pub struct DocumentListItem {
    slug: &'static str,
    label: &'static str,
    filename: &'static str,
    download_url: String,
}

pub async fn list_documents() -> Json<Vec<DocumentListItem>> {
    Json(
        DOCUMENTS
            .iter()
            .map(|doc| DocumentListItem {
                slug: doc.slug,
                label: doc.label,
                filename: doc.filename,
                download_url: format!("/documents/{}/emitir", doc.slug),
            })
            .collect(),
    )
}

pub async fn emit_document(
    Path(slug): Path<String>,
    Json(payload): Json<Value>,
) -> Result<axum::response::Response, (StatusCode, String)> {
    let definition = DOCUMENTS
        .iter()
        .find(|doc| doc.slug == slug)
        .ok_or((StatusCode::NOT_FOUND, "documento nao encontrado".to_string()))?;

    let markers = build_markers(&payload);
    let bytes = match load_template_bytes(definition.filename) {
        Some(template_bytes) => {
            build_docx_from_template(&template_bytes, &markers)
                .or_else(|_| build_fallback_docx(definition, &markers))
                .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))?
        }
        None => build_fallback_docx(definition, &markers)
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))?,
    };

    let filename = format!("{}_preenchido.docx", definition.slug);
    let mut response = axum::response::Response::new(axum::body::Body::from(bytes));
    *response.status_mut() = StatusCode::OK;
    let headers = response.headers_mut();
    headers.insert(
        header::CONTENT_TYPE,
        HeaderValue::from_static("application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
    );
    headers.insert(
        header::CONTENT_DISPOSITION,
        HeaderValue::from_str(&format!("attachment; filename=\"{}\"", filename))
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?,
    );
    Ok(response)
}

fn load_template_bytes(filename: &str) -> Option<Vec<u8>> {
    template_dirs()
        .into_iter()
        .map(|dir| dir.join(filename))
        .find_map(|path| std::fs::read(path).ok())
}

fn template_dirs() -> Vec<PathBuf> {
    let mut dirs = Vec::new();
    if let Ok(dir) = std::env::var("DOCS_DIR") {
        let trimmed = dir.trim();
        if !trimmed.is_empty() {
            dirs.push(PathBuf::from(trimmed));
        }
    }

    dirs.push(PathBuf::from("docs"));
    dirs.push(PathBuf::from("../docs"));
    dirs.push(PathBuf::from("../../docs"));
    dirs
}

fn build_markers(payload: &Value) -> BTreeMap<String, String> {
    let mut markers = BTreeMap::new();
    flatten_value(None, payload, &mut markers);

    let now = chrono::Local::now();
    markers.entry("dia".to_string()).or_insert_with(|| now.format("%d").to_string());
    markers
        .entry("mes".to_string())
        .or_insert_with(|| month_name_pt(now.month()).to_string());
    markers.entry("ano".to_string()).or_insert_with(|| now.format("%Y").to_string());

    let snapshot = serde_json::to_string_pretty(payload).unwrap_or_else(|_| "{}".to_string());
    markers.entry("json".to_string()).or_insert(snapshot);
    markers
}

fn flatten_value(prefix: Option<&str>, value: &Value, markers: &mut BTreeMap<String, String>) {
    match value {
        Value::Object(map) => {
            for (key, nested) in map {
                let next = match prefix {
                    Some(base) => format!("{base}_{key}"),
                    None => key.clone(),
                };
                flatten_value(Some(&next), nested, markers);
            }
        }
        Value::Array(items) => {
            let joined = items
                .iter()
                .map(json_value_to_string)
                .filter(|item| !item.trim().is_empty())
                .collect::<Vec<_>>()
                .join(", ");
            if let Some(base) = prefix {
                markers.insert(base.to_string(), joined);
            }
            for (index, nested) in items.iter().enumerate() {
                let numbered = match prefix {
                    Some(base) => format!("{base}_{}", index + 1),
                    None => (index + 1).to_string(),
                };
                flatten_value(Some(&numbered), nested, markers);
            }
        }
        _ => {
            if let Some(base) = prefix {
                markers.insert(base.to_string(), json_value_to_string(value));
            }
        }
    }
}

fn json_value_to_string(value: &Value) -> String {
    match value {
        Value::Null => String::new(),
        Value::Bool(v) => {
            if *v {
                "Sim".to_string()
            } else {
                "Nao".to_string()
            }
        }
        Value::Number(v) => v.to_string(),
        Value::String(v) => v.clone(),
        Value::Array(_) | Value::Object(_) => serde_json::to_string(value).unwrap_or_default(),
    }
}

fn build_docx_from_template(
    template_bytes: &[u8],
    markers: &BTreeMap<String, String>,
) -> Result<Vec<u8>, String> {
    let reader = Cursor::new(template_bytes);
    let mut archive = ZipArchive::new(reader).map_err(|e| e.to_string())?;
    let cursor = Cursor::new(Vec::new());
    let mut writer = ZipWriter::new(cursor);

    for index in 0..archive.len() {
        let mut file = archive.by_index(index).map_err(|e| e.to_string())?;
        let name = file.name().to_string();
        let options = FileOptions::default().compression_method(file.compression());

        if file.is_dir() {
            writer.add_directory(name, options).map_err(|e| e.to_string())?;
            continue;
        }

        let mut bytes = Vec::new();
        file.read_to_end(&mut bytes).map_err(|e| e.to_string())?;

        if should_replace_in_file(&name) {
            if let Ok(text) = String::from_utf8(bytes.clone()) {
                let replaced = replace_placeholders(&text, markers);
                bytes = replaced.into_bytes();
            }
        }

        writer.start_file(name, options).map_err(|e| e.to_string())?;
        writer.write_all(&bytes).map_err(|e| e.to_string())?;
    }

    writer
        .finish()
        .map(|cursor| cursor.into_inner())
        .map_err(|e| e.to_string())
}

fn should_replace_in_file(name: &str) -> bool {
    name.ends_with(".xml") || name.ends_with(".rels") || name.ends_with(".txt")
}

fn replace_placeholders(template: &str, markers: &BTreeMap<String, String>) -> String {
    markers.iter().fold(template.to_string(), |acc, (key, value)| {
        acc.replace(&format!("{{{key}}}"), &xml_escape(value))
    })
}

fn build_fallback_docx(
    definition: &DocumentDefinition,
    markers: &BTreeMap<String, String>,
) -> Result<Vec<u8>, String> {
    let cursor = Cursor::new(Vec::new());
    let mut writer = ZipWriter::new(cursor);
    let options = FileOptions::default().compression_method(CompressionMethod::Deflated);

    writer
        .start_file("[Content_Types].xml", options)
        .map_err(|e| e.to_string())?;
    writer
        .write_all(
            br#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>"#,
        )
        .map_err(|e| e.to_string())?;

    writer
        .add_directory("_rels/", options)
        .map_err(|e| e.to_string())?;
    writer
        .start_file("_rels/.rels", options)
        .map_err(|e| e.to_string())?;
    writer
        .write_all(
            br#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>"#,
        )
        .map_err(|e| e.to_string())?;

    writer
        .add_directory("word/", options)
        .map_err(|e| e.to_string())?;
    writer
        .start_file("word/document.xml", options)
        .map_err(|e| e.to_string())?;

    let mut paragraphs = Vec::new();
    paragraphs.push(xml_paragraph(definition.label, true));
    paragraphs.push(xml_paragraph("Documento gerado automaticamente.", false));

    for (key, value) in markers {
        if value.trim().is_empty() || key == "json" {
            continue;
        }
        paragraphs.push(xml_paragraph(&format!("{key}: {value}"), false));
    }

    if paragraphs.len() <= 2 {
        paragraphs.push(xml_paragraph("Sem dados para preencher.", false));
    }

    let document_xml = format!(
        concat!(
            r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>"#,
            r#"<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">"#,
            r#"<w:body>{}</w:body></w:document>"#
        ),
        paragraphs.join("")
    );
    writer
        .write_all(document_xml.as_bytes())
        .map_err(|e| e.to_string())?;

    writer
        .finish()
        .map(|cursor| cursor.into_inner())
        .map_err(|e| e.to_string())
}

fn xml_paragraph(text: &str, bold: bool) -> String {
    if bold {
        format!(
            r#"<w:p><w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">{}</w:t></w:r></w:p>"#,
            xml_escape(text)
        )
    } else {
        format!(
            r#"<w:p><w:r><w:t xml:space="preserve">{}</w:t></w:r></w:p>"#,
            xml_escape(text)
        )
    }
}

fn xml_escape(value: &str) -> String {
    value
        .replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&apos;")
}

fn month_name_pt(month: u32) -> &'static str {
    match month {
        1 => "janeiro",
        2 => "fevereiro",
        3 => "marco",
        4 => "abril",
        5 => "maio",
        6 => "junho",
        7 => "julho",
        8 => "agosto",
        9 => "setembro",
        10 => "outubro",
        11 => "novembro",
        12 => "dezembro",
        _ => "",
    }
}

#[allow(dead_code)]
fn _path_exists(path: &StdPath) -> bool {
    path.exists()
}
