from app.database import db
from sqlalchemy import func
from werkzeug.security import generate_password_hash, check_password_hash

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.BigInteger, primary_key=True)
    name = db.Column(db.Text)
    email = db.Column(db.Text, nullable=False, unique=True, index=True)
    role = db.Column(db.Text, nullable=False)
    password_hash = db.Column(db.Text)
    created_at = db.Column(db.DateTime(timezone=True), server_default=func.now(), nullable=False)
    last_login_at = db.Column(db.DateTime(timezone=True))
    deleted_at = db.Column(db.DateTime(timezone=True))

    __table_args__ = (
        db.CheckConstraint("role in ('admin','user')", name="ck_users_role"),
    )

    def set_password(self, raw):
        self.password_hash = generate_password_hash(raw)

    def check_password(self, raw):
        return check_password_hash(self.password_hash or "", raw)