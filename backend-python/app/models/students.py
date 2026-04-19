from app.database import db
from sqlalchemy import func


class Student(db.Model):
    __tablename__ = "students"

    id = db.Column(db.BigInteger, primary_key=True)

    nome_completo = db.Column(db.Text, nullable=False, index=True)
    data_nascimento = db.Column(db.Date)
    idade = db.Column(db.Integer)
    naturalidade = db.Column(db.Text)
    raca_cor = db.Column(db.Text)
    sexo = db.Column(db.Text)
    rg = db.Column(db.Text)
    cpf = db.Column(db.Text, index=True)
    nis = db.Column(db.Text)

    certidao_termo = db.Column(db.Text)
    certidao_folha = db.Column(db.Text)
    certidao_livro = db.Column(db.Text)

    endereco_cep = db.Column(db.Text)
    endereco_logradouro = db.Column(db.Text)
    endereco_numero = db.Column(db.Text)
    endereco_complemento = db.Column(db.Text)
    endereco_bairro = db.Column(db.Text, index=True)
    endereco_cidade = db.Column(db.Text)
    endereco_uf = db.Column(db.Text)

    nome_pai = db.Column(db.Text)
    nome_mae = db.Column(db.Text)
    cras_referencia = db.Column(db.Text)
    estado_civil_pais = db.Column(db.Text)

    contato_conjuge_nome = db.Column(db.Text)
    contato_conjuge_telefone = db.Column(db.Text)

    tipo_domicilio = db.Column(db.Text)
    renda_familiar = db.Column(db.Text)

    escola_nome = db.Column(db.Text, index=True)
    escola_serie = db.Column(db.Text)
    escola_ano = db.Column(db.Text)
    escola_professor = db.Column(db.Text)
    escola_periodo = db.Column(db.Text)
    historico_escolar = db.Column(db.Text)

    ubs_referencia = db.Column(db.Text)

    tem_problema_saude = db.Column(db.Boolean, nullable=False, server_default="false")
    problema_saude_descricao = db.Column(db.Text)

    tem_restricoes = db.Column(db.Boolean, nullable=False, server_default="false")
    restricoes_descricao = db.Column(db.Text)

    usa_medicamentos = db.Column(db.Boolean, nullable=False, server_default="false")
    medicamentos_descricao = db.Column(db.Text)

    tem_alergias = db.Column(db.Boolean, nullable=False, server_default="false")
    alergias_descricao = db.Column(db.Text)

    acompanhamentos = db.Column(db.Text)

    tem_deficiencia = db.Column(db.Boolean, nullable=False, server_default="false")
    deficiencia_descricao = db.Column(db.Text)

    tem_supervisao = db.Column(db.Boolean, nullable=False, server_default="false")
    supervisao_descricao = db.Column(db.Text)

    atividades_extras = db.Column(db.Text)

    termo_responsabilidade = db.Column(db.Boolean, nullable=False, server_default="false")
    autorizacao_imagem = db.Column(db.Boolean, nullable=False, server_default="false")
    autorizacao_saida = db.Column(db.Text)

    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_by_user_id = db.Column(db.BigInteger, db.ForeignKey("users.id"))
    created_by_email = db.Column(db.Text, nullable=False)
    updated_at = db.Column(db.DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    updated_by_user_id = db.Column(db.BigInteger, db.ForeignKey("users.id"))
    updated_by_email = db.Column(db.Text, nullable=False)

    __table_args__ = (
        db.CheckConstraint(
            "autorizacao_saida in ('sim', 'nao', 'somente-com-responsavel')",
            name="ck_students_autorizacao_saida",
        ),
    )


class StudentResponsavelLegal(db.Model):
    __tablename__ = "student_responsaveis_legais"

    id = db.Column(db.BigInteger, primary_key=True)
    student_id = db.Column(db.BigInteger, db.ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    posicao = db.Column(db.SmallInteger, nullable=False)
    nome = db.Column(db.Text)
    data_nascimento = db.Column(db.Date)
    rg = db.Column(db.Text)
    cpf = db.Column(db.Text)
    celular = db.Column(db.Text)
    operadora = db.Column(db.Text)
    whatsapp = db.Column(db.Text)
    fixo = db.Column(db.Text)
    parentesco = db.Column(db.Text)

    __table_args__ = (
        db.CheckConstraint("posicao in (1, 2)", name="ck_responsavel_posicao"),
        db.UniqueConstraint("student_id", "posicao", name="uq_student_responsavel_posicao"),
    )


class StudentMembroFamiliar(db.Model):
    __tablename__ = "student_membros_familiares"

    id = db.Column(db.BigInteger, primary_key=True)
    student_id = db.Column(db.BigInteger, db.ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    nome = db.Column(db.Text)
    parentesco = db.Column(db.Text)
    profissao = db.Column(db.Text)
    renda = db.Column(db.Text)


class StudentPessoaAutorizada(db.Model):
    __tablename__ = "student_pessoas_autorizadas"

    id = db.Column(db.BigInteger, primary_key=True)
    student_id = db.Column(db.BigInteger, db.ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    nome = db.Column(db.Text)
    documento = db.Column(db.Text)
    parentesco = db.Column(db.Text)
    telefone = db.Column(db.Text)


class StudentBeneficio(db.Model):
    __tablename__ = "student_beneficios"

    student_id = db.Column(db.BigInteger, db.ForeignKey("students.id", ondelete="CASCADE"), primary_key=True)
    beneficio = db.Column(db.Text, primary_key=True)


class StudentInteracaoSocial(db.Model):
    __tablename__ = "student_interacao_social"

    student_id = db.Column(db.BigInteger, db.ForeignKey("students.id", ondelete="CASCADE"), primary_key=True)
    item = db.Column(db.Text, primary_key=True)


class StudentLocalLazer(db.Model):
    __tablename__ = "student_locais_lazer"

    student_id = db.Column(db.BigInteger, db.ForeignKey("students.id", ondelete="CASCADE"), primary_key=True)
    item = db.Column(db.Text, primary_key=True)


class StudentServicoUtilizado(db.Model):
    __tablename__ = "student_servicos_utilizados"

    student_id = db.Column(db.BigInteger, db.ForeignKey("students.id", ondelete="CASCADE"), primary_key=True)
    item = db.Column(db.Text, primary_key=True)


class StudentAuditEvent(db.Model):
    __tablename__ = "student_audit_events"

    id = db.Column(db.BigInteger, primary_key=True)
    student_id = db.Column(db.BigInteger, db.ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    student_name = db.Column(db.Text, nullable=False)
    action = db.Column(db.Text, nullable=False)
    at = db.Column(db.DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    by_user_id = db.Column(db.BigInteger, db.ForeignKey("users.id"))
    by_email = db.Column(db.Text, nullable=False, index=True)
    changed_fields = db.Column(db.JSON)

    __table_args__ = (
        db.CheckConstraint("action in ('create', 'update', 'delete')", name="ck_student_audit_events_action"),
    )
