import time
import os
from .document_processor import (
    process_and_vectorize_document,
    search_documents,
    delete_document_chunks,
    clean_html_response,
    UPLOAD_DIR)

import logging
logger = logging.getLogger(__name__)


def background_task(upload_files):
    logger.info(f"[STARTED] Processing files: {upload_files}")
    try:

        for file in upload_files:
            logger.info("files -"+ str(file))
            file_name = file.get("saved_name")
            file_type = file.get("saved_name").split(".")[1]
            file_id = file.get("id")
            user_id = file.get("user_id")
            folder_id = file.get("folder_id")
            file_path=f"{UPLOAD_DIR}/user_{str(user_id)}/folder_{str(folder_id)}/{str(file_name)}"
            if os.path.exists(file_path):
                logger.info(f"File exists: {file_path}")

            result  = process_and_vectorize_document(file_path, file_id, user_id, file_name, file_type)
            logger.info(f"Result: {result}")
    except Exception as e:
        logger.exception("Error in background task")
            
    # Simulate long task
    logger.info(f"[FINISHED] Done with files: {upload_files}")