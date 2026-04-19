from app.database import db

class StudentAttendance(db.Model):
    __tablename__ = "student_attendance"

    id = db.Column(db.BigInteger, primary_key=True)
    student_id = db.Column(db.BigInteger, db.ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    data = db.Column(db.Date, nullable=False, index=True)
    status = db.Column(db.Text, nullable=False)

    __table_args__ = (
        db.CheckConstraint("status in ('Presença','Falta')", name="ck_att_status"),
        db.UniqueConstraint("student_id", "data", name="uq_att_student_day"),
    )
