# app/routes.py
from flask import Blueprint, request, render_template, redirect, url_for, jsonify, session, render_template_string, current_app
from .models import User, Connection, ChatSession, Message,ChartData, AccesstokenData
from . import db
from flask_login import login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from .services import re_get_connection , get_processed_data, generate_unique_embed_id, validate_access_token, create_access_token, schema_for_api_calls
import mysql.connector
import psycopg2
from collections import defaultdict
import json
from flask_cors import cross_origin
from werkzeug.utils import secure_filename

from functools import wraps

from flask import session
import uuid
import random
from itertools import chain
import jwt
import os 
active_connections = {}

main = Blueprint("main", __name__)

def authenticate(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')

        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({'error': 'Authorization header missing or malformed'}), 401

        access_token = auth_header.split()[1]
        result = validate_access_token(access_token)

        # ✅ Handle error dicts returned by validate_access_token
        if isinstance(result, dict) and 'error' in result:
            return jsonify({'error': result['error']}), 401

        # ✅ Unpack result
        payload, user_id, db_id , schema = result

        # Inject into route as kwargs
        kwargs['token'] = access_token
        kwargs['user_id'] = user_id
        kwargs['db_id'] = db_id
        kwargs["schema"] = schema

        return f(*args, **kwargs)

    return decorated_function

@main.route('/')
def home():
    return render_template('login.html')


@main.errorhandler(401)
def unauthorized(e):
    return redirect(url_for('main.login'))

@main.route("/register",  methods=["GET", "POST"])
def register():
    if request.method == "POST":
        data = request.get_json()
        print("register data",data)
        email = data.get("email")
        password = data.get("password")

        if User.query.filter_by(email=email).first():
            return jsonify({"message": "User already exists"}), 409

        hashed_pw = generate_password_hash(password)
        new_user = User(email=email, password=hashed_pw)
        db.session.add(new_user)
        db.session.commit()
        return jsonify({"message": "Registered successfully"}), 200

    return render_template("register.html")


@main.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        session_expired = request.args.get('session_expired')
        if session_expired:
            return render_template('login.html', session_expired=True)
        else:
            data = request.get_json()
            print("login-data",data)
            email = data.get("email")
            password = data.get("password")

            user = User.query.filter_by(email=email).first()
            if user and check_password_hash(user.password, password):
                login_user(user)
                session.permanent = True
                user_id=user.id
                print("user_id",user_id)
                chat_session = ChatSession.query.filter_by(user_id=user.id).first()
                if chat_session:
                    return jsonify({'session_id': chat_session.session_id,"user_id":user_id})
                else:
                    # Create a new session ID if it doesn't exist
                    new_session_id = str(uuid.uuid4())
                    chat_session = ChatSession(user_id=user.id, session_id=new_session_id)
                    db.session.add(chat_session)
                    db.session.commit()
                    
                    return jsonify({'session_id': new_session_id, "user_id":user_id})
                #return jsonify({"message": "Login successful"}), 200
            return jsonify({"message": "Invalid credentials"}), 401

    return render_template("login.html")


@main.route("/dashboard")
@login_required
def dashboard():
    if current_user.is_authenticated:
        connections = Connection.query.filter_by(user_id=current_user.id).all()
        print(connections)
        
        return render_template('dashboard-new.html', connections=connections, email=current_user.email)
    else:
        return redirect(url_for('/login'))


@main.route("/databases")
@login_required
def databases():
    if current_user.is_authenticated:
        connections = Connection.query.filter_by(user_id=current_user.id).all()
        print(connections)
        
        return render_template('dashboard-new.html', connections=connections, email=current_user.email)
    else:
        return redirect(url_for('/login'))


@main.route("/connection_form")
@login_required
def connection_form():
    return render_template("add_database_form.html")

@main.route("/login-success")
def login_success():
    return render_template("login-success.html")

######## ----dblist  page routings------



@main.route("/add-database")
@login_required
def add_database():
    return render_template("add_database_new.html", email=current_user.email)



@main.route('/save_connection', methods=['POST'])
@login_required
def save_connection():
    if current_user.is_authenticated:
        current_time = datetime.utcnow()
        data = request.get_json()
        if data:
            name = data.get('name')
            host = data.get('host')
            database = data.get('database')
            db_user = data.get('user')
            password = data.get('password')
            port = data.get('port')
            db_system = data.get('db_system')
            connection = Connection(
                user_id=current_user.id,
                name=name,
                host=host,
                database=database,
                db_user=db_user,
                password=password,
                port=port,
                created_at=current_time,
                db_system=db_system
            )
            db.session.add(connection)
            db.session.commit()
            return 'Connection saved successfully!'
        else:
            return 'All fields are required!'
    else:
        return 'You need to login first!'
    
@main.route('/get_connections')
@login_required
def get_connections():
    if current_user.is_authenticated:
        connections = Connection.query.filter_by(user_id=current_user.id).all()
        print("connections",connections)
        return render_template('db_list.html', connections=connections)
    else:
        return redirect(url_for('/login'))

@main.route('/connections/<int:connection_id>', methods=['DELETE'])
@login_required
def delete_connection(connection_id):
    connection = Connection.query.filter_by(id=connection_id, user_id=current_user.id).first()
    if connection:
        db.session.delete(connection)
        db.session.commit()
        return jsonify({'success': True})
    else:
        return jsonify({'success': False, 'error': 'Connection not found'}), 404
    


@main.route('/connections/<int:connection_id>/post', methods=['POST'])
@login_required
def connect_connection(connection_id):
    connection = Connection.query.filter_by(id=connection_id, user_id=current_user.id).first()
    if not connection:
        return jsonify({'success': False, 'error': 'Connection not found'}), 404

    try:
        print(repr(connection.name))
        print(repr(connection.db_system))
        # Establish the connection to the third-party database
        print(connection.db_system == "PostgreSQL")
        if connection.db_system == "PostgreSQL":
            try:
                print("Entered")
                conn = psycopg2.connect(
                    dbname=connection.database,
                    user=connection.db_user,
                    password=connection.password,
                    host=connection.host,
                    port=connection.port
                )

                active_connections[(current_user.id, connection_id)] = conn

                return jsonify({'success': True})
            except Exception as e:
                print("PostgreSQL", e)

        if  connection.db_system == "MySQL":

            conn = mysql.connector.connect(
                host=connection.host,
                port=connection.port,
                database=connection.database,
                user=connection.db_user,
                password=connection.password,
            )

            # Save this connection in the global dict using (user_id, connection_id) as key
            active_connections[(current_user.id, connection_id)] = conn

            # # Optionally mark it as connected in DB
            # connection.is_connected = True
            # db.session.commit()

            return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500



@main.route('/api/connections/<int:connection_id>', methods=['GET'])
@login_required
def edit_connection(connection_id):
    connection = Connection.query.filter_by(id=connection_id, user_id=current_user.id).first()
    if not connection:
        return jsonify({'success': False, 'error': 'Connection not found'}), 404

    try:
        data={}
        data['name']=connection.name,
        data['dbname']=connection.database,
        data["user"]=connection.db_user,
        data["password"]=connection.password,
        data["host"]=connection.host,
        data["port"]=connection.port
        print(data)
        return jsonify({'success': True, "data" :data})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    

@main.route('/api/connections/<int:connection_id>', methods=['PUT'])
@login_required
def update_connection(connection_id):
    connection = Connection.query.filter_by(id=connection_id, user_id=current_user.id).first()
    if not connection:
        return jsonify({'success': False, 'error': 'Connection not found'}), 404

    try:
        data = request.get_json()
        connection.name = data['name']
        connection.database = data['dbname']
        connection.db_user = data['user']
        connection.password = data['password']
        connection.host = data['host']
        connection.port = data['port']

        db.session.commit()
        return jsonify({'success': True, 'message': 'Connection updated successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500
    
@main.route('/connections/<int:connection_id>/delete', methods=['DELETE'])
@login_required
def disconnect_connection(connection_id):
    try:
        # Retrieve the established connection object from the session
        conn = session.get(f'connection_{connection_id}')

        if conn:
            # Close the connection
            conn.close()
            # Remove the connection from the session
            session.pop(f'connection_{connection_id}')

        # # Update the connection status in the database
        # connection = Connection.query.filter_by(id=connection_id, user_id=current_user.id).first()
        # connection.is_connected = False
        # db.session.commit()

        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


######## ----chat page routings------

@main.route('/connections/<int:connection_id>/schema', methods=['GET'])
@login_required
def get_schema(connection_id):
    active_connections = {}
    db_system =""
    if len(active_connections)==0:
        print("Before active_connections length",len(active_connections))
        active_connections, db_name, db_system = re_get_connection(connection_id, current_user.id)
    print("After",len(active_connections), db_name)
    if (current_user.id, connection_id) not in active_connections:
        return jsonify({'success': False, 'error': 'Connection not found'}), 404
    schema_data = {}

    if db_system=="MySQL":
        conn = active_connections[(current_user.id, connection_id)]
        cursor = conn.cursor()
        
        # Fetch schema data
        cursor.execute("SHOW TABLES")
        tables = cursor.fetchall()
        tables_data = []
        schema_data = {}
        for table in tables:
            table_name = table[0]
            cursor.execute(f"DESCRIBE {table_name}")
            columns = cursor.fetchall()
            tables_data.append({
                'name': table_name,
                'columns': [{'name': col[0], 'type': col[1]} for col in columns]
            })
        schema_data["database"] = db_name
        schema_data["tables"] = tables_data
    
        print("schema_data",schema_data)
    if db_system =="PostgreSQL":
        conn = active_connections[(current_user.id, connection_id)]
        cursor = conn.cursor()

        # Get all tables in public schema
        cursor.execute("""
            SELECT table_name, column_name, 
                data_type, character_maximum_length,
                numeric_precision, numeric_scale
            FROM information_schema.columns
            WHERE table_schema = 'public'
            ORDER BY table_name, ordinal_position;
        """)

        schema_map = defaultdict(list)

        for table_name, col_name, data_type, char_len, num_precision, num_scale in cursor.fetchall():
            # Reconstruct full type info
            if data_type == 'character varying' and char_len:
                column_type = f"varchar({char_len})"
            elif data_type == 'numeric' and num_precision is not None:
                column_type = f"decimal({num_precision},{num_scale})"
            elif data_type == 'integer':
                column_type = "int"
            elif data_type == 'boolean':
                column_type = "tinyint(1)"
            else:
                column_type = data_type

            schema_map[table_name].append({
                "name": col_name,
                "type": column_type
            })

        # Convert to desired format
        schema_json = {
            "tables": [
                {"name": table, "columns": cols}
                for table, cols in schema_map.items()
            ]
        }

        cursor.close()
        conn.close()

        # Print as JSON
        schema_data["database"] = db_name
        schema_data["tables"] = schema_json["tables"]

    return jsonify({'success': True, "data": schema_data})


@main.route('/query', methods=['POST'])
@login_required
def query_database():
    connection_id = request.json['connection_id']
    query = request.json['query']

    try:
        # Retrieve the established connection object from the session
        conn = session[f'connection_{connection_id}']
        cur = conn.cursor()
        cur.execute(query)
        results = cur.fetchall()
        cur.close()
        return jsonify({'success': True, 'results': results})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    




@main.route("/chat/<chat_id>")
@login_required
def chat_form(chat_id):
    return render_template("chat-new.html",chat_id=chat_id)


@main.route('/get_messages', methods=['GET'])
@login_required
def get_messages():
    session_id = request.args.get('session_id')
    db_id = request.args.get('db_id')
    print("conversation",session_id)

    conversations = Message.query.filter_by(session_id=session_id,db_id=db_id).order_by(Message.created_at.desc()).limit(50).all()[::-1]
    chart_msgs = ChartData.query.filter_by(user_id=current_user.id, db_id=db_id).order_by(ChartData.created_at.desc()).limit(25).all()[::-1]
    combined = sorted(chain(conversations, chart_msgs), key=lambda msg: msg.created_at)
    # for converstion in combined:
    #     print(converstion)
    messages = []
    for msg in combined:
        if isinstance(msg, Message):
            #print(f"[TEXT] {msg.created_at} | {msg.sender}: {msg.message}")
            messages.append({'message': msg.message, 'sender': msg.sender})
        elif isinstance(msg, ChartData):
            #print(f"[CHART] {msg.created_at} | {msg.db_id}: {msg.content}")
            messages.append({'message': msg.content, 'sender': "chart", "embed_id":msg.embed_id})
    # messages = [
    #     {'message': conversation.message, 'sender': conversation.sender}
    #     for conversation in conversations
    # ]
    print("messages histry length",len(messages))
    return jsonify(messages)

@main.route('/delete_session', methods=['POST'])
@login_required
def delete_session():
    session_id = request.json['session_id']
    print("conversation",session_id)
    conversations = Message.query.filter_by(session_id=session_id).order_by(Message.created_at.desc()).limit(50).all()
    mysql.connection.commit()
    cur.close()
    return jsonify({'success': True})

@main.route("/chat_ai", methods=['POST'])
@login_required
def chat_ai():
    if current_user.is_authenticated:
        session_id = request.json['session_id']
        usermessage = request.json['message']
        schema_data = request.json['schema_data']
        dbId = request.json['dbId']
        print( "active_connections",session_id,usermessage)
        print("active_connections",len(active_connections))
        try:
            connection = Message(
                session_id = session_id,
                message = usermessage,
                sender = 'user',
                db_id = dbId
                )
            db.session.add(connection)
            db.session.commit()
        except Exception as e:
            print(e)
        result, ai_data = get_processed_data(schema_data,usermessage, current_user.id, dbId)
        print("result,ai_data",result,ai_data)

        chart_descriptions = [
        "A chart showing motivational messages by theme.",
        "Each row represents an inspiring quote and its focus area.",
        "The table includes message number, text, and category.",
        "This layout helps organize ideas clearly and visually.",
        "Themes include coding, growth, innovation, and more.",
        "It's a clean way to present information in rows and columns.",
        "The format makes data easy to scan and understand quickly.",
        "Messages encourage creativity, learning, and persistence.",
        "Designed to look like a markdown-style table.",
        "Perfect for documentation, presentations, or dashboards."
        ]
        aimessage = random.choice(chart_descriptions)
        data = {"message":"I am here to help you with SQL queries and data visualization"}
        if type(result)==str:
            aimessage =result
            data["message"] =result
        print("ai_data",ai_data)
        if ai_data:
            data = ai_data
            aimessage = ai_data.get("message")

        #inset Ai Message
        try:
            connection = Message(
                session_id = session_id,
                message = aimessage,
                sender = 'Ai',
                db_id = dbId
                )
            db.session.add(connection)
            db.session.commit()
        except Exception as e:
            print(e)

        # insert charrt data
        try:
            embed_id = generate_unique_embed_id()
            connection = ChartData(
                user_id = current_user.id,
                db_id = dbId,
                content = data,
                embed_id=embed_id
                )
            db.session.add(connection)
            db.session.commit()
            data["embed_id"]=embed_id
        except Exception as e:
            print(e)

        return jsonify({'success': True, 'data': data})
    else:
        return redirect(url_for('/login'))

@main.route('/create_chat_session', methods=['POST'])
@login_required
def create_chat_session():
    user_id = request.json['user_id']
    db_id = request.json['db_id']
    session_id = str(uuid.uuid4())
    cur = mysql.connection.cursor()
    cur.execute("INSERT INTO chat_sessions (user_id, db_id, session_id) VALUES (%s, %s, %s)", (user_id, db_id, session_id))
    mysql.connection.commit()
    cur.close()
    return jsonify({'session_id': session_id})


@main.route('/embed/<embed_id>')
def embed_chart(embed_id):
    try:
        chart = ChartData.query.filter_by(embed_id=embed_id).one()
        print("chart",chart)
        if not chart:
            return "Chart not found", 404
            
        #
        chart_data = chart.content
        print(chart_data, type(chart_data))
        chart_type = chart_data.get("chart_type")
        
        # Render different templates based on chart type
        return render_template_string(f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Embedded Chart</title>
            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
            <style>
                body {{
                    margin: 0;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    background-color: #f8f9fa;
                }}
                .chart-container {{
                    width: 90%;
                    max-width: 800px;
                    background: white;
                    border-radius: 10px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    padding: 20px;
                }}
            </style>
        </head>
        <body>
            <div class="chart-container">
                <canvas id="embeddedChart"></canvas>
            </div>
            
            <script>
                const chartData = {json.dumps(chart_data.get("chart_data"))};
                
                // Initialize chart
                const ctx = document.getElementById('embeddedChart').getContext('2d');
                const config = createChartConfig('{chart_type}', chartData);
                new Chart(ctx, config);
                
                // Chart config generator
                function createChartConfig(type, data) {{
                    switch(type) {{
                        case 'bar':
                            return {{
                                type: 'bar',
                                data: {{
                                    labels: data.labels || ['Default'],
                                    datasets: [{{
                                        label: data.title || 'Chart',
                                        data: data.values || [0],
                                        backgroundColor: '#4e73df',
                                        borderColor: '#2e59d9',
                                        borderWidth: 1
                                    }}]
                                }},
                                options: {{
                                    responsive: true,
                                    plugins: {{
                                        legend: {{ display: false }},
                                        title: {{ 
                                            display: true, 
                                            text: data.title || '',
                                            font: {{ size: 16 }}
                                        }}
                                    }},
                                    scales: {{
                                        y: {{ beginAtZero: true }}
                                    }}
                                }}
                            }};
                        // Add cases for other chart types
                        case 'line':
                            // Line chart config
                        case 'pie':
                            // Pie chart config
                        default:
                            return {{
                                // Default config
                            }};
                    }}
                }}
            </script>
        </body>
        </html>
        """)
        
    except Exception as e:
        return f"Error rendering chart: {str(e)}", 500
    



@main.route('/get_secret', methods=['POST'])
@login_required
def get_key():
    db_id = request.json['db_id']
    user_id = request.json['user_id']
    print("conversation",db_id,user_id)
    token,secret =  create_access_token(user_id,db_id)

    return jsonify({'success': True, 'secret_key': secret})


@main.route('/get_access_token', methods=['POST'])
@cross_origin(origins="*")  # Allow all origins for this route only
def get_token():
    try:
        key = request.json.get('key')
        connection = AccesstokenData.query.filter_by(secret_key=key).first()
        token = ""
        if connection:
            token = connection.token
            try:
                payload = jwt.decode(token, key, algorithms=['HS256'])
            except jwt.ExpiredSignatureError:
                    return {'key_error': 'key_error'}
            except jwt.InvalidTokenError:
                    return {'error': 'Invalid key'}
        return jsonify({'success': True, 'secret_key': token})
    except Exception as e:
        print('Error:', e)
        return jsonify({'success': False}), 500
    

@main.route('/get_info', methods=['POST'])
@cross_origin(origins="*")
@authenticate
def get_info(token=None, user_id=None, db_id=None, schema={}):
    data = request.get_json()
    user_message = data.get("message")
    # connection = AccesstokenData.query.filter_by(user_id=user_id, db_id=db_id).first()
    # schema = {}
    # if connection:
    #     schema = connection.schema
    print("schema",schema)
    message, data  = get_processed_data(schema, user_message, user_id, db_id)
    if type(message) ==bool:
        print("data--", data)
        message =  data.get("message")
        return jsonify({'reply': f"{message}", "data" :data })
    else:
        return jsonify({'reply': f"{message}", "data" :data })


@main.route('/upload')
@login_required
def upload_page():
    if current_user.is_authenticated:
        print(current_app.config['ALLOWED_EXTENSIONS'])
        return render_template('add_files_form.html')
    else:
        return redirect(url_for('/login'))


@main.route('/uploadfiles', methods=['POST'])
@login_required
def upload_files():
    try:
        # Basic server-side checks (still recommended for security)
        if 'folderName' not in request.form:
            return jsonify({'error': 'Folder name is required'}), 400
        
        folder_name = secure_filename(request.form['folderName'])  # ✅ Now this will work
        if not folder_name:
            return jsonify({'error': 'Invalid folder name'}), 400
        
        if 'files' not in request.files:
            return jsonify({'error': 'No files provided'}), 400
        
        files = request.files.getlist('files')
        if not files or all(file.filename == '' for file in files):
            return jsonify({'error': 'No files selected'}), 400
        
        # Create folder path
        upload_folder = current_app.config['UPLOAD_FOLDER']
        folder_path = os.path.join(upload_folder, folder_name)
        
        # Handle duplicate folder names
        # counter = 1
        # original_folder_path = folder_path
        # while os.path.exists(folder_path):
        #     folder_path = f"{original_folder_path}_{counter}"
        #     counter += 1
        
        os.makedirs(folder_path, exist_ok=True)
        
        uploaded_files = []
        
        for file in files:
            if file and file.filename != '':
                filename = secure_filename(file.filename)  # ✅ And this will work too
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
            'message': 'Files uploaded successfully',
            'folder_name': os.path.basename(folder_path),
            'uploaded_files': uploaded_files,
            'total_files': len(uploaded_files),
            'total_size': sum(file['size'] for file in uploaded_files)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Upload failed: {str(e)}'}), 500



@main.route('/folder/<folder_name>')
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

@main.route('/delete_file', methods=['DELETE'])
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

@main.route('/update_folder', methods=['POST'])
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



@main.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect("/login")
