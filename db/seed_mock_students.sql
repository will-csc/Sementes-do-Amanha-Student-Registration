-- Script de seed para o backend Python (SQLite)
-- Não possui COMMIT explícito, conforme solicitado.
-- Pode ser executado inteiro de uma vez.

INSERT OR IGNORE INTO users (
  name,
  email,
  role,
  status,
  password_hash,
  created_at,
  last_login_at,
  approved_at,
  deleted_at
)
VALUES (
  'Administrador',
  'adm@sementesdoamanha.com',
  'admin',
  'approved',
  'scrypt:32768:8:1$mock$mock',
  '2026-05-06 09:00:00',
  '2026-05-06 09:00:00',
  '2026-05-06 09:00:00',
  NULL
);

INSERT INTO students (
  nome_completo,
  foto_crianca,
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
  beneficio_outros,
  ativo,
  unidade,
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
  created_at,
  created_by_user_id,
  created_by_email,
  updated_at,
  updated_by_user_id,
  updated_by_email
)
SELECT
  'Ana Clara Souza',
  '',
  '2016-03-15',
  10,
  'Taboão da Serra/SP',
  'Parda',
  'Feminino',
  '456789123',
  '12345678901',
  '12345678901',
  '1234567',
  '101',
  'AB123',
  '06765000',
  'Rua das Flores',
  '120',
  'Casa 2',
  'Jardim Mirna',
  'Taboão da Serra',
  'SP',
  'Carlos Souza',
  'Fernanda Souza',
  'CRAS Jardim Mirna',
  'Casado(a)',
  'Carlos Souza',
  '11987654321',
  'Alugado',
  'R$ 2.350,00',
  '',
  1,
  'Unidade Mirna',
  'EMEF Monte Alegre',
  '5ª série',
  '5º ano',
  'Juliana Lima',
  'Tarde',
  'Sem ocorrências relevantes.',
  'UBS Jardim Record',
  0,
  '',
  1,
  'Restrição a corantes artificiais.',
  0,
  '',
  1,
  'Alergia a poeira.',
  'Acompanhamento social no território.',
  0,
  '',
  1,
  'Precisa de apoio nas travessias de rua.',
  'Balé e reforço escolar.',
  1,
  1,
  'somente-com-responsavel',
  '2026-05-06 10:00:00',
  (SELECT id FROM users WHERE email = 'adm@sementesdoamanha.com' AND deleted_at IS NULL LIMIT 1),
  'adm@sementesdoamanha.com',
  '2026-05-06 10:00:00',
  (SELECT id FROM users WHERE email = 'adm@sementesdoamanha.com' AND deleted_at IS NULL LIMIT 1),
  'adm@sementesdoamanha.com'
WHERE NOT EXISTS (SELECT 1 FROM students WHERE cpf = '12345678901');

INSERT INTO students (
  nome_completo,
  foto_crianca,
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
  beneficio_outros,
  ativo,
  unidade,
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
  created_at,
  created_by_user_id,
  created_by_email,
  updated_at,
  updated_by_user_id,
  updated_by_email
)
SELECT
  'João Pedro Lima',
  '',
  '2014-08-21',
  11,
  'São Paulo/SP',
  'Branca',
  'Masculino',
  '334455667',
  '23456789012',
  '23456789012',
  '2345678',
  '202',
  'CD456',
  '06766010',
  'Avenida dos Ipês',
  '45',
  'Bloco B',
  'Parque Pinheiros',
  'Taboão da Serra',
  'SP',
  'Rogério Lima',
  'Patrícia Lima',
  'CRAS Parque Pinheiros',
  'União Estável',
  'Patrícia Lima',
  '11981234567',
  'Próprio',
  'R$ 3.100,00',
  'Auxílio transporte escolar',
  1,
  'Unidade Centro',
  'EMEF Machado de Assis',
  '6ª série',
  '6º ano',
  'Ricardo Alves',
  'Manhã',
  'Mudou de escola em 2025.',
  'UBS Oliveiras',
  1,
  'Asma leve.',
  0,
  '',
  1,
  'Bombinha quando necessário.',
  0,
  '',
  'Acompanhamento no CAPS infantil.',
  0,
  '',
  0,
  '',
  'Futebol.',
  1,
  0,
  'sim',
  '2026-05-06 10:15:00',
  (SELECT id FROM users WHERE email = 'adm@sementesdoamanha.com' AND deleted_at IS NULL LIMIT 1),
  'adm@sementesdoamanha.com',
  '2026-05-06 10:15:00',
  (SELECT id FROM users WHERE email = 'adm@sementesdoamanha.com' AND deleted_at IS NULL LIMIT 1),
  'adm@sementesdoamanha.com'
WHERE NOT EXISTS (SELECT 1 FROM students WHERE cpf = '23456789012');

INSERT INTO students (
  nome_completo,
  foto_crianca,
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
  beneficio_outros,
  ativo,
  unidade,
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
  created_at,
  created_by_user_id,
  created_by_email,
  updated_at,
  updated_by_user_id,
  updated_by_email
)
SELECT
  'Maria Eduarda Santos',
  '',
  '2012-11-02',
  13,
  'Embu das Artes/SP',
  'Preta',
  'Feminino',
  '998877665',
  '34567890123',
  '34567890123',
  '3456789',
  '303',
  'EF789',
  '06767020',
  'Rua Esperança',
  '300',
  '',
  'Jardim Saint Moritz',
  'Taboão da Serra',
  'SP',
  'Paulo Santos',
  'Luciana Santos',
  'CRAS Saint Moritz',
  'Divorciado(a)',
  'Luciana Santos',
  '11992345678',
  'Cedido',
  'R$ 1.780,00',
  '',
  0,
  'Unidade São Judas',
  'EE Professora Zilda Natel',
  '8ª série',
  '8º ano',
  'Marcos Vinícius',
  'Integral',
  'Retornou às aulas após mudança de endereço.',
  'UBS Santa Cecília',
  0,
  '',
  0,
  '',
  0,
  '',
  1,
  'Alergia a camarão.',
  'Atendimento psicossocial eventual.',
  1,
  'Baixa visão no olho esquerdo.',
  1,
  'Necessita apoio no deslocamento noturno.',
  'Oficina de artes e coral.',
  1,
  1,
  'nao',
  '2026-05-06 10:30:00',
  (SELECT id FROM users WHERE email = 'adm@sementesdoamanha.com' AND deleted_at IS NULL LIMIT 1),
  'adm@sementesdoamanha.com',
  '2026-05-06 10:30:00',
  (SELECT id FROM users WHERE email = 'adm@sementesdoamanha.com' AND deleted_at IS NULL LIMIT 1),
  'adm@sementesdoamanha.com'
WHERE NOT EXISTS (SELECT 1 FROM students WHERE cpf = '34567890123');

INSERT INTO student_responsaveis_legais (student_id, posicao, nome, data_nascimento, rg, cpf, celular, operadora, whatsapp, fixo, parentesco)
SELECT id, 1, 'Fernanda Souza', '1987-09-10', '221334455', '45678912300', '11987654321', 'Vivo', '11987654321', '1140023001', 'Mãe'
FROM students
WHERE cpf = '12345678901'
  AND NOT EXISTS (SELECT 1 FROM student_responsaveis_legais WHERE student_id = students.id AND posicao = 1);

INSERT INTO student_responsaveis_legais (student_id, posicao, nome, data_nascimento, rg, cpf, celular, operadora, whatsapp, fixo, parentesco)
SELECT id, 2, 'Carlos Souza', '1984-04-22', '554433221', '45678912311', '11999887766', 'Claro', '11999887766', '1140023002', 'Pai'
FROM students
WHERE cpf = '12345678901'
  AND NOT EXISTS (SELECT 1 FROM student_responsaveis_legais WHERE student_id = students.id AND posicao = 2);

INSERT INTO student_responsaveis_legais (student_id, posicao, nome, data_nascimento, rg, cpf, celular, operadora, whatsapp, fixo, parentesco)
SELECT id, 1, 'Patrícia Lima', '1988-01-15', '112233445', '56789012344', '11981234567', 'TIM', '11981234567', '1140112200', 'Mãe'
FROM students
WHERE cpf = '23456789012'
  AND NOT EXISTS (SELECT 1 FROM student_responsaveis_legais WHERE student_id = students.id AND posicao = 1);

INSERT INTO student_responsaveis_legais (student_id, posicao, nome, data_nascimento, rg, cpf, celular, operadora, whatsapp, fixo, parentesco)
SELECT id, 2, 'Rogério Lima', '1983-12-02', '667788990', '56789012355', '11981110000', 'Vivo', '11981110000', '1140112201', 'Pai'
FROM students
WHERE cpf = '23456789012'
  AND NOT EXISTS (SELECT 1 FROM student_responsaveis_legais WHERE student_id = students.id AND posicao = 2);

INSERT INTO student_responsaveis_legais (student_id, posicao, nome, data_nascimento, rg, cpf, celular, operadora, whatsapp, fixo, parentesco)
SELECT id, 1, 'Luciana Santos', '1985-05-19', '778899001', '67890123455', '11992345678', 'Claro', '11992345678', '1140998877', 'Mãe'
FROM students
WHERE cpf = '34567890123'
  AND NOT EXISTS (SELECT 1 FROM student_responsaveis_legais WHERE student_id = students.id AND posicao = 1);

INSERT INTO student_responsaveis_legais (student_id, posicao, nome, data_nascimento, rg, cpf, celular, operadora, whatsapp, fixo, parentesco)
SELECT id, 2, 'Paulo Santos', '1982-03-30', '665544332', '67890123466', '11993456789', 'TIM', '11993456789', '1140998878', 'Pai'
FROM students
WHERE cpf = '34567890123'
  AND NOT EXISTS (SELECT 1 FROM student_responsaveis_legais WHERE student_id = students.id AND posicao = 2);

INSERT INTO student_membros_familiares (student_id, nome, parentesco, profissao, renda)
SELECT id, 'Pedro Souza', 'Irmão', 'Estudante', 'R$ 0,00'
FROM students
WHERE cpf = '12345678901'
  AND NOT EXISTS (SELECT 1 FROM student_membros_familiares WHERE student_id = students.id AND nome = 'Pedro Souza');

INSERT INTO student_membros_familiares (student_id, nome, parentesco, profissao, renda)
SELECT id, 'Helena Lima', 'Irmã', 'Estudante', 'R$ 0,00'
FROM students
WHERE cpf = '23456789012'
  AND NOT EXISTS (SELECT 1 FROM student_membros_familiares WHERE student_id = students.id AND nome = 'Helena Lima');

INSERT INTO student_membros_familiares (student_id, nome, parentesco, profissao, renda)
SELECT id, 'Dona Célia Santos', 'Avó', 'Aposentada', 'R$ 1.412,00'
FROM students
WHERE cpf = '34567890123'
  AND NOT EXISTS (SELECT 1 FROM student_membros_familiares WHERE student_id = students.id AND nome = 'Dona Célia Santos');

INSERT INTO student_pessoas_autorizadas (student_id, nome, documento, parentesco, telefone)
SELECT id, 'Mariana Souza', '78901234567', 'Tia', '11995554444'
FROM students
WHERE cpf = '12345678901'
  AND NOT EXISTS (SELECT 1 FROM student_pessoas_autorizadas WHERE student_id = students.id AND documento = '78901234567');

INSERT INTO student_pessoas_autorizadas (student_id, nome, documento, parentesco, telefone)
SELECT id, 'José Lima', '78901234568', 'Avô', '11994443333'
FROM students
WHERE cpf = '23456789012'
  AND NOT EXISTS (SELECT 1 FROM student_pessoas_autorizadas WHERE student_id = students.id AND documento = '78901234568');

INSERT INTO student_pessoas_autorizadas (student_id, nome, documento, parentesco, telefone)
SELECT id, 'Renata Santos', '78901234569', 'Tia', '11993332222'
FROM students
WHERE cpf = '34567890123'
  AND NOT EXISTS (SELECT 1 FROM student_pessoas_autorizadas WHERE student_id = students.id AND documento = '78901234569');

INSERT OR IGNORE INTO student_beneficios (student_id, beneficio)
SELECT id, 'Bolsa Família' FROM students WHERE cpf = '12345678901';

INSERT OR IGNORE INTO student_beneficios (student_id, beneficio)
SELECT id, 'Tarifa Social' FROM students WHERE cpf = '12345678901';

INSERT OR IGNORE INTO student_beneficios (student_id, beneficio)
SELECT id, 'Outros' FROM students WHERE cpf = '23456789012';

INSERT OR IGNORE INTO student_beneficios (student_id, beneficio)
SELECT id, 'BPC' FROM students WHERE cpf = '34567890123';

INSERT OR IGNORE INTO student_interacao_social (student_id, item)
SELECT id, 'Família' FROM students WHERE cpf = '12345678901';

INSERT OR IGNORE INTO student_interacao_social (student_id, item)
SELECT id, 'Amigos' FROM students WHERE cpf = '12345678901';

INSERT OR IGNORE INTO student_interacao_social (student_id, item)
SELECT id, 'Escola' FROM students WHERE cpf = '23456789012';

INSERT OR IGNORE INTO student_interacao_social (student_id, item)
SELECT id, 'Comunidade' FROM students WHERE cpf = '34567890123';

INSERT OR IGNORE INTO student_locais_lazer (student_id, item)
SELECT id, 'Praça' FROM students WHERE cpf = '12345678901';

INSERT OR IGNORE INTO student_locais_lazer (student_id, item)
SELECT id, 'Quadra' FROM students WHERE cpf = '23456789012';

INSERT OR IGNORE INTO student_locais_lazer (student_id, item)
SELECT id, 'Casa de parentes' FROM students WHERE cpf = '34567890123';

INSERT OR IGNORE INTO student_servicos_utilizados (student_id, item)
SELECT id, 'CRAS' FROM students WHERE cpf = '12345678901';

INSERT OR IGNORE INTO student_servicos_utilizados (student_id, item)
SELECT id, 'CAPS' FROM students WHERE cpf = '23456789012';

INSERT OR IGNORE INTO student_servicos_utilizados (student_id, item)
SELECT id, 'UBS' FROM students WHERE cpf = '34567890123';

INSERT INTO student_transporte (student_id, utiliza_van, endereco_rota, observacoes)
SELECT id, 'Lista de espera', 'Ponto da padaria central', 'Aguardando vaga na rota da tarde.'
FROM students
WHERE cpf = '12345678901'
  AND NOT EXISTS (SELECT 1 FROM student_transporte WHERE student_id = students.id);

INSERT INTO student_transporte (student_id, utiliza_van, endereco_rota, observacoes)
SELECT id, 'Sim', 'Rua principal do bairro', 'Buscar às 07:10.'
FROM students
WHERE cpf = '23456789012'
  AND NOT EXISTS (SELECT 1 FROM student_transporte WHERE student_id = students.id);

INSERT INTO student_transporte (student_id, utiliza_van, endereco_rota, observacoes)
SELECT id, 'Não', '', 'Família leva e busca.'
FROM students
WHERE cpf = '34567890123'
  AND NOT EXISTS (SELECT 1 FROM student_transporte WHERE student_id = students.id);

INSERT INTO student_attendance (student_id, data, status)
SELECT id, '2026-05-05', 'Presença'
FROM students
WHERE cpf = '12345678901'
  AND NOT EXISTS (SELECT 1 FROM student_attendance WHERE student_id = students.id AND data = '2026-05-05');

INSERT INTO student_attendance (student_id, data, status)
SELECT id, '2026-05-05', 'Falta'
FROM students
WHERE cpf = '23456789012'
  AND NOT EXISTS (SELECT 1 FROM student_attendance WHERE student_id = students.id AND data = '2026-05-05');

INSERT INTO student_attendance (student_id, data, status)
SELECT id, '2026-05-05', 'Presença'
FROM students
WHERE cpf = '34567890123'
  AND NOT EXISTS (SELECT 1 FROM student_attendance WHERE student_id = students.id AND data = '2026-05-05');

INSERT INTO student_audit_events (student_id, student_name, action, at, by_user_id, by_email, changed_fields)
SELECT id, nome_completo, 'create', '2026-05-06 10:00:00',
  (SELECT id FROM users WHERE email = 'adm@sementesdoamanha.com' AND deleted_at IS NULL LIMIT 1),
  'adm@sementesdoamanha.com',
  NULL
FROM students
WHERE cpf = '12345678901'
  AND NOT EXISTS (SELECT 1 FROM student_audit_events WHERE student_id = students.id AND action = 'create');

INSERT INTO student_audit_events (student_id, student_name, action, at, by_user_id, by_email, changed_fields)
SELECT id, nome_completo, 'create', '2026-05-06 10:15:00',
  (SELECT id FROM users WHERE email = 'adm@sementesdoamanha.com' AND deleted_at IS NULL LIMIT 1),
  'adm@sementesdoamanha.com',
  NULL
FROM students
WHERE cpf = '23456789012'
  AND NOT EXISTS (SELECT 1 FROM student_audit_events WHERE student_id = students.id AND action = 'create');

INSERT INTO student_audit_events (student_id, student_name, action, at, by_user_id, by_email, changed_fields)
SELECT id, nome_completo, 'create', '2026-05-06 10:30:00',
  (SELECT id FROM users WHERE email = 'adm@sementesdoamanha.com' AND deleted_at IS NULL LIMIT 1),
  'adm@sementesdoamanha.com',
  NULL
FROM students
WHERE cpf = '34567890123'
  AND NOT EXISTS (SELECT 1 FROM student_audit_events WHERE student_id = students.id AND action = 'create');
