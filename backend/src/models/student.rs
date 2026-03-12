use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StudentListItem {
  pub id: String,
  pub nome_completo: String,
  pub idade: Option<i32>,
  pub nome_mae: Option<String>,
  pub escola_nome: Option<String>,
  pub sexo: Option<String>,
  pub cpf: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StudentAuditEvent {
  pub id: String,
  pub student_id: String,
  pub student_name: String,
  pub action: String,
  pub at: String,
  pub by_email: String,
  pub changed_fields: Option<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ResponsavelLegal {
  pub nome: String,
  pub data_nascimento: String,
  pub rg: String,
  pub cpf: String,
  pub celular: String,
  pub operadora: String,
  pub whatsapp: String,
  pub fixo: String,
  pub parentesco: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct MembroFamiliar {
  pub nome: String,
  pub parentesco: String,
  pub profissao: String,
  pub renda: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PessoaAutorizada {
  pub nome: String,
  pub documento: String,
  pub parentesco: String,
  pub telefone: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct StudentDraft {
  pub nome_completo: String,
  pub data_nascimento: String,
  pub idade: Option<i32>,
  pub naturalidade: String,
  pub raca_cor: String,
  pub sexo: String,
  pub rg: String,
  pub cpf: String,
  pub nis: String,
  pub certidao_termo: String,
  pub certidao_folha: String,
  pub certidao_livro: String,
  pub endereco_cep: String,
  pub endereco_logradouro: String,
  pub endereco_numero: String,
  pub endereco_complemento: String,
  pub endereco_bairro: String,
  pub endereco_cidade: String,
  pub endereco_uf: String,
  pub nome_pai: String,
  pub nome_mae: String,
  pub cras_referencia: String,
  pub responsaveis_legais: Vec<ResponsavelLegal>,
  pub membros_familiares: Vec<MembroFamiliar>,
  pub estado_civil_pais: String,
  pub contato_conjuge_nome: String,
  pub contato_conjuge_telefone: String,
  pub tipo_domicilio: String,
  pub renda_familiar: String,
  pub beneficios: Vec<String>,
  pub escola_nome: String,
  pub escola_serie: String,
  pub escola_ano: String,
  pub escola_professor: String,
  pub escola_periodo: String,
  pub historico_escolar: String,
  pub ubs_referencia: String,
  pub tem_problema_saude: bool,
  pub problema_saude_descricao: String,
  pub tem_restricoes: bool,
  pub restricoes_descricao: String,
  pub usa_medicamentos: bool,
  pub medicamentos_descricao: String,
  pub tem_alergias: bool,
  pub alergias_descricao: String,
  pub acompanhamentos: String,
  pub tem_deficiencia: bool,
  pub deficiencia_descricao: String,
  pub tem_supervisao: bool,
  pub supervisao_descricao: String,
  pub interacao_social: Vec<String>,
  pub locais_lazer: Vec<String>,
  pub atividades_extras: String,
  pub servicos_utilizados: Vec<String>,
  pub termo_responsabilidade: bool,
  pub autorizacao_imagem: bool,
  pub autorizacao_saida: String,
  pub pessoas_autorizadas: Vec<PessoaAutorizada>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Student {
  pub id: String,
  #[serde(flatten)]
  pub data: StudentDraft,
}

