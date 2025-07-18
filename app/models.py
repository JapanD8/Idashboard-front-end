from . import db
from flask_login import UserMixin
from sqlalchemy.types import JSON as GenericJSON

class User(db.Model, UserMixin):
    __tablename__ = "user"
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)


class Connection(db.Model):
    __tablename__ = "db_connections"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    name = db.Column(db.String(100), nullable=False)
    host = db.Column(db.String(100), nullable=False)
    database = db.Column(db.String(100), nullable=False)
    db_user = db.Column(db.String(100), nullable=False)
    password = db.Column(db.String(255), nullable=False)
    port = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False)
    db_system = db.Column(db.String(50), nullable=False)

    user = db.relationship('User', backref=db.backref('db_connections', lazy=True))
    chart_data = db.relationship('ChartData', backref='connection', lazy=True, cascade="all, delete-orphan", passive_deletes=True)
    chat_sessions = db.relationship('ChatSession', backref='connection', lazy=True, cascade="all, delete-orphan", passive_deletes=True)


class ChatSession(db.Model):
    __tablename__ = "chat_sessions"
    session_id = db.Column(db.String(255), primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    db_id = db.Column(db.Integer, db.ForeignKey('db_connections.id', ondelete="CASCADE"))
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    messages = db.relationship('Message', backref='chat_session', lazy=True, cascade="all, delete-orphan", passive_deletes=True)

class Message(db.Model):
    __tablename__ = "messages"
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(255), db.ForeignKey('chat_sessions.session_id'), nullable=False)
    message = db.Column(db.Text, nullable=False)
    sender = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    db_id = db.Column(db.Integer, db.ForeignKey('db_connections.id',ondelete="CASCADE"), index=True, nullable=True)



class ChartData(db.Model):
    __tablename__ = "chart_messages"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), index=True, nullable=False)
    db_id = db.Column(db.Integer, db.ForeignKey('db_connections.id', ondelete="CASCADE"), index=True, nullable=False)
    content = db.Column(GenericJSON, nullable=False)  # Chart data as JSON
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    embed_id = db.Column(db.String(8), nullable=True, unique=True)


class AccesstokenData(db.Model):
    __tablename__ = "access_tokenData"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), index=True, nullable=False)
    db_id = db.Column(db.Integer, db.ForeignKey('db_connections.id', ondelete="CASCADE"), index=True, nullable=False)
    token = db.Column(db.String(255), nullable=True)
    secret_key = db.Column(db.String(255), nullable=True, index=True)
    schema = db.Column(GenericJSON, nullable=False) 
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    
