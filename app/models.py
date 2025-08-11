from . import db
from flask_login import UserMixin
from sqlalchemy.types import JSON as GenericJSON
import json

class User(db.Model, UserMixin):
    __tablename__ = "user"
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    #role = db.Column(db.String(20), nullable=False, default='user') 


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
    


# ragbot Tables

class UserFolder(db.Model):
    __tablename__ = "user_folder"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    total_files = db.Column(db.Integer, default=0)
    file_types_json = db.Column(db.Text, default='[]')
    status = db.Column(db.String(50), default='active')

    user = db.relationship('User', backref='folders')
    messages = db.relationship('RagMessage', backref='folder', lazy=True, cascade="all, delete-orphan", passive_deletes=True)
    #messages = db.relationship('RagMessage', backref='chat_session', lazy=True, cascade="all, delete-orphan", passive_deletes=True)
    ### folder = UserFolder.query.get(folder_id)
    ### db.session.delete(folder)
    ### db.session.commit() 

    @property
    def file_types(self):
        return json.loads(self.file_types_json or '[]')

    @file_types.setter
    def file_types(self, types_list):
        self.file_types_json = json.dumps(types_list)


class Files(db.Model):
    __tablename__ = "user_files"
    id = db.Column(db.Integer, primary_key=True)
    original_name = db.Column(db.String(200))
    saved_name = db.Column(db.String(200))
    size = db.Column(db.Integer)
    folder_id = db.Column(db.Integer, db.ForeignKey('user_folder.id'), nullable=False)
    uploaded_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    status = db.Column(db.String(50), default='active')

    def to_dict(self):
        return {
            'id': self.id,
            'original_name': self.original_name,
            'saved_name': self.saved_name,
            'size': self.size,
            'folder_id': self.folder_id,
            'uploaded_at': self.uploaded_at
        }

class RagMessage(db.Model):
    __tablename__ = "rag_messages"
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(255), db.ForeignKey('chat_sessions.session_id'), nullable=False)
    message = db.Column(db.Text, nullable=False)
    sender = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    db_id = db.Column(db.Integer, db.ForeignKey('user_folder.id', ondelete="CASCADE"), index=True, nullable=True)