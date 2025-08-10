import os
from dotenv import load_dotenv
load_dotenv()
os.environ['LANGCHAIN_TRACING'] = 'false'
os.environ['POSTHOG_DISABLED'] = 'true'
class Config:
    # SECRET_KEY = os.environ.get('SECRET_KEY') or 'your_secret_key'
    # SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
    #     'mysql+pymysql://flask_user:flask_password@db/flask_db'
    # SQLALCHEMY_TRACK_MODIFICATIONS = False
    allowed_ext_str = os.getenv("ALLOWED_EXTENSIONS", "")
    max_size_str = os.getenv("MAX_CONTENT_LENGTH", "0")  # default "0" if not set
    GOOGLE_API_KEY = "AIzaSyDD_mBqp3Gp6KAFpux9lYWka9BpjWrGJTg"
    
    UPLOAD_FOLDER = 'uploads'
    MAX_CONTENT_LENGTH = int(max_size_str)
    ALLOWED_EXTENSIONS = set(allowed_ext_str.split(","))

    SEMANTIC_MIN_CHUNK_SIZE = int(os.getenv("SEMANTIC_MIN_CHUNK_SIZE", "1000"))  # Minimum characters per chunk
    SEMANTIC_MAX_CHUNK_SIZE = int(os.getenv("SEMANTIC_MAX_CHUNK_SIZE", "25000"))  # Maximum characters per chunk
    SEMANTIC_BUFFER_SIZE = int(os.getenv("SEMANTIC_BUFFER_SIZE", "1"))  # Number of sentences to group
    SEMANTIC_THRESHOLD_TYPE = os.getenv("SEMANTIC_THRESHOLD_TYPE", "percentile")  # percentile, standard_deviation, interquartile, gradient
    SEMANTIC_THRESHOLD_AMOUNT = float(os.getenv("SEMANTIC_THRESHOLD_AMOUNT", "0.95")) if os.getenv("SEMANTIC_THRESHOLD_AMOUNT") else None  # Custom threshold
    SEMANTIC_NUMBER_OF_CHUNKS = int(os.getenv("SEMANTIC_NUMBER_OF_CHUNKS")) if os.getenv("SEMANTIC_NUMBER_OF_CHUNKS") else None  # Target number of chunks 

    @classmethod
    def init_app(cls, app):
        os.makedirs(cls.UPLOAD_FOLDER, exist_ok=True)

    