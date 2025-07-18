import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.exc import OperationalError
from dotenv import load_dotenv

db = SQLAlchemy()
migrate = Migrate()
login_manager = LoginManager()

def create_app():
    load_dotenv()
    
    mysql_user = os.getenv("MYSQL_USER", "root")
    mysql_pw = os.getenv("MYSQL_PASSWORD", "")
    db_name = os.getenv("MYSQL_DB", "authdb")
    host = os.getenv("HOST", "host.docker.internal")

    # ✅ Step 1: connect to MySQL server without DB
    server_uri = f"mysql+pymysql://{mysql_user}:{mysql_pw}@{host}"
    engine = create_engine(server_uri)

    # # ✅ Step 2: create database if it does not exist
    # with engine.connect() as conn:
    #     conn.execute(text(f"CREATE DATABASE IF NOT EXISTS {db_name}"))

    # ✅ Step 3: now configure Flask app with the DB
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = f"{server_uri}/{db_name}"
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['PERMANENT_SESSION_LIFETIME'] = 1800
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {'pool_pre_ping': True,'pool_recycle': 280}
    app.secret_key = os.getenv("SECRET_KEY", "dev-secret")

    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)


    from .models import User

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    # ✅ Step 4: create tables if missing
    with app.app_context():
        inspector = inspect(db.engine)
        existing_tables = inspector.get_table_names()
        if not {'user', 'db_connections'}.issubset(existing_tables):
            db.create_all()

    # ✅ Register routes
    from .routes import main
    app.register_blueprint(main)

    return app
