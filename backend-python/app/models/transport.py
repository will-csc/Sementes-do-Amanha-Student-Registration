from app.database import db

class StudentTransporte(db.Model):
    __tablename__ = "student_transporte"

    id = db.Column(db.BigInteger, primary_key=True)
    student_id = db.Column(db.BigInteger, db.ForeignKey("students.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    utiliza_van = db.Column(db.Text)
    endereco_rota = db.Column(db.Text)
    observacoes = db.Column(db.Text)

    __table_args__ = (
        db.CheckConstraint("utiliza_van in ('Sim','Não','Lista de espera')", name="ck_transp_utiliza_van"),
    )