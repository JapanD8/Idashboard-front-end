# init_db.py
from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

mysql_user = os.getenv("MYSQL_USER", "root")
mysql_pw = os.getenv("MYSQL_PASSWORD", "saravananyugan")
db_name = os.getenv("MYSQL_DB", "authdb")
server_uri = f"mysql+pymysql://{mysql_user}:{mysql_pw}@localhost"

engine = create_engine(server_uri)
with engine.connect() as conn:
    conn.execute(text(f"CREATE DATABASE IF NOT EXISTS {db_name}"))
