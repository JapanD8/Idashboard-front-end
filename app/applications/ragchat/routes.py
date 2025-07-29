from flask import Blueprint, request, render_template, redirect, url_for, jsonify, session, render_template_string, current_app
from app.models import User, Connection, ChatSession, Message,ChartData, AccesstokenData, UserFolder, Files, RagMessage
from app.models import db 
from flask_login import login_user, login_required, logout_user, current_user
from werkzeug.utils import secure_filename
from concurrent.futures import ThreadPoolExecutor
executor = ThreadPoolExecutor(max_workers=3)

from .services import background_task, search_documents, clean_html_response
import os
import logging
logger = logging.getLogger(__name__)

from langchain_google_genai import GoogleGenerativeAI
from config import Config as config

GOOGLE_API_KEY = config.GOOGLE_API_KEY


ragchat = Blueprint('another', __name__, url_prefix='/rb')

@ragchat.route('/')
@login_required
def other_home():
    return "Hello from another module!"


@ragchat.route('/uploadfiles', methods=['POST'])
@login_required
def upload_files():
    try:
        user_id = current_user.id

        folder_name = request.form.get('folderName')
        if not folder_name:
            return jsonify({'error': 'Folder name is required'}), 400

        files = request.files.getlist('files')
        
        if not files or all(file.filename == '' for file in files):
            return jsonify({'error': 'No files selected'}), 400

        file_types = set([os.path.splitext(file.filename)[1] for file in files])

        # Create DB folder entry
        new_folder = UserFolder(name=folder_name, user_id=user_id,total_files=len(files))
        new_folder.file_types = list(file_types)
        db.session.add(new_folder)
        db.session.commit()  # to get new_folder.id

        # Path: uploads/user_<user_id>/folder_<folder_id>/
        base_path = current_app.config['UPLOAD_FOLDER']
        folder_path = os.path.join(base_path, f"user_{user_id}", f"folder_{new_folder.id}")
        os.makedirs(folder_path, exist_ok=True)

        uploaded_files = []
        bulk_file_records = []
        for file in files:
            if file.filename != '':
                original_name = file.filename
                filename = secure_filename(original_name)
                file_path = os.path.join(folder_path, filename)
                print(file_path)
                
                file.save(file_path)
                file_size = os.path.getsize(file_path)

                # Save file metadata in DB
                file_record = Files(
                    original_name=original_name,
                    saved_name=filename,
                    size=file_size,
                    folder_id=new_folder.id
                )
                bulk_file_records.append(file_record)
                uploaded_files.append({
                    'original_name': original_name,
                    'saved_name': filename,
                    'size': file_size,
                    'file_path':file_path,
                    "folder_id":new_folder.id
                })
        db.session.add_all(bulk_file_records)
        db.session.commit()

        uploaded_files = []
        for f in bulk_file_records:
            uploaded_files.append({
                'id': f.id,  # Newly inserted ID
                'original_name': f.original_name,
                'saved_name': f.saved_name,
                'size': f.size,
                "folder_id":f.folder_id,
                "user_id":user_id,
            })
        try:
            executor.submit(background_task, uploaded_files)
        except Exception as e:
            print(e)

        # return jsonify({
        #     'message': 'Files uploaded successfully',
        #     'folder_id': new_folder.id,
        #     'uploaded_files': uploaded_files,
        #     'total_files': len(uploaded_files),
        #     'total_size': sum(file['size'] for file in uploaded_files)
        # }), 200
        return jsonify({"message": f"Task '{"1"}' submitted"}), 200
    except Exception as e:
        return jsonify({'error': f'Upload failed: {str(e)}'}), 500



@ragchat.route('/folder/<folder_name>')
@login_required
def get_folder_contents(folder_name):
    """Get contents of a specific folder"""
    try:
        upload_folder = current_app.config['UPLOAD_FOLDER']
        folder_name = secure_filename(folder_name)
        folder_path = os.path.join(upload_folder, folder_name)
        
        if not os.path.exists(folder_path):
            return jsonify({'error': 'Folder not found'}), 404
        
        files = []
        for filename in os.listdir(folder_path):
            file_path = os.path.join(folder_path, filename)
            if os.path.isfile(file_path):
                files.append({
                    'name': filename,
                    'size': os.path.getsize(file_path),
                    'modified': os.path.getmtime(file_path)
                })
        
        return jsonify({
            'folder_name': folder_name,
            'files': files,
            'total_files': len(files),
            'total_size': sum(file['size'] for file in files)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to get folder contents: {str(e)}'}), 500

@ragchat.route('/delete_file', methods=['DELETE'])
@login_required
def delete_file():
    """Delete a specific file from a folder"""
    try:
        data = request.get_json()
        folder_name = secure_filename(data.get('folderName', ''))
        file_name = secure_filename(data.get('fileName', ''))
        
        if not folder_name or not file_name:
            return jsonify({'error': 'Folder name and file name are required'}), 400
        
        upload_folder = current_app.config['UPLOAD_FOLDER']
        file_path = os.path.join(upload_folder, folder_name, file_name)
        
        if not os.path.exists(file_path):
            return jsonify({'error': 'File not found'}), 404
        
        os.remove(file_path)
        return jsonify({'message': f'File "{file_name}" deleted successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to delete file: {str(e)}'}), 500

@ragchat.route('/update_folder', methods=['POST'])
@login_required
def update_folder():
    """Update folder name and add new files"""
    try:
        original_folder_name = secure_filename(request.form.get('originalFolderName', ''))
        new_folder_name = secure_filename(request.form.get('newFolderName', ''))
        
        if not original_folder_name or not new_folder_name:
            return jsonify({'error': 'Both original and new folder names are required'}), 400
        
        upload_folder = current_app.config['UPLOAD_FOLDER']
        original_path = os.path.join(upload_folder, original_folder_name)
        
        if not os.path.exists(original_path):
            return jsonify({'error': 'Original folder not found'}), 404
        
        # Handle folder rename if name changed
        if original_folder_name != new_folder_name:
            new_path = os.path.join(upload_folder, new_folder_name)
            
            # Handle duplicate folder names
            counter = 1
            while os.path.exists(new_path):
                new_path = os.path.join(upload_folder, f"{new_folder_name}_{counter}")
                counter += 1
            
            os.rename(original_path, new_path)
            folder_path = new_path
            final_folder_name = os.path.basename(new_path)
        else:
            folder_path = original_path
            final_folder_name = original_folder_name
        
        # Add new files if any
        uploaded_files = []
        if 'newFiles' in request.files:
            files = request.files.getlist('newFiles')
            
            for file in files:
                if file and file.filename != '':
                    filename = secure_filename(file.filename)
                    if filename:
                        # Handle duplicate filenames
                        file_path = os.path.join(folder_path, filename)
                        counter = 1
                        original_filename = filename
                        name, ext = os.path.splitext(original_filename)
                        
                        # while os.path.exists(file_path):
                        #     filename = f"{name}_{counter}{ext}"
                        #     file_path = os.path.join(folder_path, filename)
                        #     counter += 1
                        
                        file.save(file_path)
                        uploaded_files.append({
                            'original_name': file.filename,
                            'saved_name': filename,
                            'size': os.path.getsize(file_path)
                        })
        
        return jsonify({
            'message': 'Folder updated successfully',
            'folder_name': final_folder_name,
            'uploaded_files': uploaded_files,
            'total_new_files': len(uploaded_files)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to update folder: {str(e)}'}), 500

@ragchat.route("/chat/<chat_id>")
@login_required
def chat_files(chat_id):
    return render_template("chat-files.html",chat_id=chat_id)


@ragchat.route('/getfiles/<int:folder_id>', methods=['GET'])
@login_required
def get_files_list(folder_id):
    try:
        files = Files.query.filter_by(folder_id=folder_id).all()
        files_dict = [file.to_dict() for file in files]

        print(files_dict)
        return jsonify({'success': True, "data": files_dict})

    except Exception as e:
        print(e)
        return jsonify({'error': f'Failed to get files: {str(e)}'}), 500


@ragchat.route('/get_messages', methods=['GET'])
@login_required
def get_ragmessages():
    session_id = request.args.get('session_id')
    db_id = request.args.get('db_id')
    print("conversation",session_id)

    conversations = RagMessage.query.filter_by(session_id=session_id,db_id=db_id).order_by(RagMessage.created_at.desc()).limit(50).all()[::-1]
    # for converstion in combined:
    #     print(converstion)
    messages = []
    for msg in conversations:
        if isinstance(msg, RagMessage):
            #print(f"[TEXT] {msg.created_at} | {msg.sender}: {msg.message}")
            messages.append({'message': msg.message, 'sender': msg.sender})
       
    # messages = [
    #     {'message': conversation.message, 'sender': conversation.sender}
    #     for conversation in conversations
    # ]
    print("messages histry length",len(messages))
    return jsonify(messages)

@ragchat.route("/chat_ai", methods=['POST'])
@login_required
def chat_ai_rag():
    if current_user.is_authenticated:
        session_id = request.json['session_id']
        usermessage = request.json['message']
        string_list= request.json['fileIds']
        file_ids = [int(x) for x in string_list]
        dbId = request.json['dbId']
        #file_ids =  [51,52]
        print( "active_connections",session_id,usermessage,dbId, file_ids)
        ###Insert user message
        try:
            connection = RagMessage(
                session_id = session_id,
                message = usermessage,
                sender = 'user',
                db_id = dbId
                )
            db.session.add(connection)
            db.session.commit()
        except Exception as e:
            print(e)
        recent_messages = db.session.query(Message).filter(Message.db_id == dbId).order_by(Message.created_at.desc()).limit(6).all()

        logger.debug(f"DEBUG: Found {len(recent_messages)} recent messages")
            
        # Build context from recent messages
        conversation_context = ""
        for msg in reversed(recent_messages):
            if msg.sender== "user":
                conversation_context += f"Human: {msg.message}"
            if msg.sender== "Ai":   
                conversation_context += f"\nAssistant: {msg.message}\n"


        logger.debug(f"DEBUG: Conversation context length: {len(conversation_context)}")
            
        # Search for relevant documents  #user_id = current_user.id
        logger.debug(f"DEBUG: Starting document search...")
        search_results = search_documents(
            query=usermessage,
            user_id=current_user.id,
            file_ids=file_ids,
            top_k=5
        )
        
        logger.debug(f"DEBUG: Search completed. Found {len(search_results)} results")
        for i, result in enumerate(search_results):
            logger.debug(f"DEBUG: Result {i+1}:")
            logger.debug(f"  - Chunk ID: {result['chunk_id']}")
            logger.debug(f"  - File Name: {result['metadata']['file_name']}")
            logger.debug(f"  - Similarity: {result['similarity']}")
            logger.debug(f"  - Content preview: {result['content'][:100]}...")
        
        # Build context from search results
        context_text = ""
        source_chunks = []
        source_files = {}  # Dictionary to store file info: {file_id: file_name}
        
        for result in search_results:
            context_text += f"Source: {result['metadata']['file_name']}\nContent: {result['content']}\n\n"
            source_chunks.append(result['chunk_id'])
            
            # Extract file info from metadata
            file_id = result['metadata']['file_id']
            file_name = result['metadata']['file_name']
            source_files[file_id] = file_name
        
        logger.debug(f"DEBUG: Built context text length: {len(context_text)}")
        logger.debug(f"DEBUG: Source chunks: {source_chunks}")
        logger.debug(f"DEBUG: Source files: {source_files}")
        
        # Generate response using Gemini
        llm = GoogleGenerativeAI(
            model="gemini-2.0-flash-exp",
            google_api_key=GOOGLE_API_KEY,
            temperature=0.7
        )

        # Create prompt with context
        prompt = f"""You are an expert AI assistant specialized in document analysis and information extraction. Based on the provided document context and conversation history, provide a comprehensive and well-structured response to the user's question.

        ## Instructions for Response Format:
        - Use clear **markdown formatting** with headers, bold text, lists, and tables where appropriate
        - Provide **detailed, thorough answers** with explanations and context
        - Structure your response with proper headings (##, ###) for different sections
        - Use bullet points or numbered lists for multiple items or steps
        - Create **tables** when presenting comparative data, specifications, or structured information
        - Use `code formatting` for technical terms, file names, or specific values
        - Include **bold** emphasis for important points and key information
        - Provide specific quotes or references from the documents when applicable

        ## Content Guidelines:
        - Give comprehensive answers that fully address the user's question
        - Provide context and background information when relevant
        - Include specific details, numbers, dates, and examples from the documents
        - Explain technical concepts clearly and thoroughly
        - If presenting multiple options or items, organize them systematically
        - Always cite specific information from the source documents

        ## Document Context:
        {context_text}

        ## Conversation History:
        {conversation_context}

        ## User Question: 
        {usermessage}

        ## Response:
        Please provide a detailed, well-formatted response based on the document context. If the documents don't contain sufficient information to fully answer the question, clearly state what information is missing and provide what details are available. Structure your response with appropriate headings and formatting to make it easy to read and understand."""
        


        logger.debug(f"DEBUG: Generated prompt length: {len(prompt)}")
        logger.debug(f"DEBUG: Prompt preview: {prompt[:200]}...")
        
        logger.debug(f"DEBUG: Calling Gemini API...")
        bot_response = llm.invoke(prompt)
        logger.debug(f"DEBUG: Raw Gemini response: {bot_response}")
        data = {}
        # Clean HTML tags and extra whitespace from the response
        bot_response = clean_html_response(bot_response)
        logger.debug(f"DEBUG: Cleaned bot response: {bot_response}")
        data["message"]= bot_response
        try:
            connection = RagMessage(
                session_id = session_id,
                message = bot_response,
                sender = 'Ai',
                db_id = dbId
                )
            db.session.add(connection)
            db.session.commit()
        except Exception as e:
            print(e)

        db.session.remove()
        return jsonify({'success': True, 'data': data})
    else:
        return redirect(url_for('/login'))