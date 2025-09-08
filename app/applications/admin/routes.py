# app/routes.py
from flask import Blueprint, request, render_template, redirect, url_for, jsonify, session, render_template_string, current_app
from app.models import User, Connection, ChatSession, Message,ChartData, AccesstokenData, UserFolder, SharedConnection, SharedFolder
from app.models import db 
from flask_login import login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
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
import random
import string
from flask_mail import Message
from app import mail
active_connections = {}

from config import Config as config

GOOGLE_API_KEY = config.GOOGLE_API_KEY



#admin = Blueprint('admin', __name__)
admin = Blueprint('admin', __name__, url_prefix='/admin')


def generate_password(length):
    letters_and_digits = string.ascii_letters + string.digits
    return ''.join(random.choice(letters_and_digits) for _ in range(length))

@admin.route('/')
def home_admin():
    return render_template('login_admin.html')


@admin.route("/register",  methods=["GET", "POST"])
def admin_register():
    if request.method == "POST":
        data = request.get_json()
        print("register data",data)
        email = data.get("email")
        password = data.get("password")

        if User.query.filter_by(email=email).first():
            return jsonify({"message": "User already exists"}), 409

        hashed_pw = generate_password_hash(password)
        new_user = User(email=email, password=hashed_pw, role="admin")
        db.session.add(new_user)
        db.session.commit()
        return jsonify({"message": "Registered successfully"}), 200

    return render_template("register_admin.html")

@admin.route('/permission')
def permission():
    if current_user.role == "admin":
        is_admin = True
    else:
        is_admin = False
    return render_template('share.html', role=is_admin)

@admin.route('/api/users')
def get_users():

    users = User.query.filter_by(role='user').all()
    user_list = []
    user_id_list = []
    for user in users:
        user_list.append({
            "id" :user.id,
            "email" : user.email
        })
        user_id_list.append(user.id)

    
    print("user_list", user_list, user_id_list)



    #users_connection_list = SharedConnection.query.filter_by(user_id=current_user.id, status='active').all()
    #users_shared_folders = SharedFolder.query.filter_by(user_id=current_user.id, status='active').all()
    users_connection_list = SharedConnection.query.filter(SharedConnection.user_id.in_(user_id_list),SharedConnection.status == 'active').all()
    users_shared_folders = SharedFolder.query.filter(SharedFolder.user_id.in_(user_id_list),SharedFolder.status == 'active').all()
    user_conn = {}
    user_fol = {}
    for con in users_connection_list:
        if con.user_id not in user_conn:
            user_conn[con.user_id] =[]
        user_conn[con.user_id].append(f"connection_{con.connection_id}")

    for fol in users_shared_folders:
        if fol.user_id not in user_fol:
            user_fol[fol.user_id] =[]
        user_fol[fol.user_id].append(f"agent_{fol.folder_id}")

    final_list = []
    for use in user_list:
        f_list = []
        if user_conn.get(use.get("id")):
             f_list+=user_conn.get(use.get("id"))

        if user_fol.get(use.get("id")):
             f_list+=user_fol.get(use.get("id"))
        use["permissions"] = f_list
        #if use.get('id') not in final_list:
            
        
    
    print("user_conn, user_fol",user_conn, user_fol)
    print("user_list_updated", user_list)
    users = [
            { "id": 'john.doe', "name": 'John Doe', "email": 'john.doe@company.com' },
            { "id": 'jane.smith', "name": 'Jane Smith', "email": 'jane.smith@company.com' },
            { "id": 'mike.wilson', "name": 'Mike Wilson', "email": 'mike.wilson@company.com' },
            { "id": 'sarah.johnson', "name": 'Sarah Johnson', "email": 'sarah.johnson@company.com' },
            { "id": 'david.brown', "name": 'David Brown', "email": 'david.brown@company.com' }
        ]
    return jsonify({"message": "Registered successfully", "data": user_list}), 200




@admin.route('/api/connection-resources')
def get_connection():

    if current_user.is_authenticated:
        connections = Connection.query.filter_by(user_id=current_user.id).all()
        connection_list = []
        for conn in connections:
            connection_list.append({
                "id": conn.id,
                "name" :conn.name,
                "database":conn.database,
                "created" :conn.created_at,
                "type":conn.db_system,
                "host": conn.host,
                "conn_type" : "connection"
            })
        # connectionResources = [
        #         { 
        #             "id": 'conn_1', 
        #             "name": 'Insurance Database', 
        #             "type": 'PostgreSQL',
        #             "owner": 'admin',
        #             "host": 'localhost',
        #             "port": '5432',
        #             "database": 'insurance_db',
        #             "created": '2025-06-23',
        #             "shared_with": ['john.doe', 'jane.smith']
        #         },
        #         { 
        #             "id": 'conn_2', 
        #             "name": 'Host INSDB', 
        #             "type": 'MySQL',
        #             "owner": 'admin',
        #             "host": 'host.docker.internal',
        #             "port": '3306',
        #             "database": 'insdb',
        #             "created": '2025-06-27',
        #             "shared_with": ['mike.wilson']
        #         }
        #     ]
    return jsonify({"message": "Registered successfully", "data":connection_list}), 200


@admin.route('/api/agent-resources')
def get_folders():
    folders = UserFolder.query.filter_by(user_id=current_user.id).all()
    folder_list = []
    for fol in folders:
        folder_list.append({
            "id": fol.id,
            "name" :fol.name,
            "created" :fol.created_at,
            "total_files":fol.total_files,
            "type": "AI Agent",
            "description":"Dock Management System",
            "shared_with":[],
            "model": 'Gemini 2.0 Flash',
            "conn_type" : "folder"
        })
    # agentResources = [
    #         { 
    #             "id": 'agent_1', 
    #             "name": 'Dock Agent', 
    #             "type": 'AI Agent',
    #             "owner": 'admin',
    #             "description": 'Dock Management System',
    #             "endpoint": 'dock.agent.internal',
    #             "model": 'GPT-4',
    #             "created": '2025-07-30',
    #             "shared_with": ['john.doe', 'mike.wilson']
    #         },
    #         { 
    #             "id": 'agent_2', 
    #             "name": 'HR Agent', 
    #             "type": 'AI Agent',
    #             "owner": 'admin',
    #             "description": 'Human Resources System',
    #             "endpoint": 'hr.agent.internal',
    #             "model": 'Claude-3',
    #             "created": '2025-07-29',
    #             "shared_with": ['jane.smith']
    #         }
    #     ]
    return jsonify({"message": "Registered successfully", "data":folder_list}), 200


@admin.route('/api/share', methods=["PUT"])
def share_conn_and_fol():
    try: 
        data = request.get_json()
        print("share connection data",data)
        #SharedConnection, SharedFolder
        connections  = []
        agents = []
        to_user = data.get("user_id")
        resources = data.get("resource_ids")
        for resource in resources:
            id= resource
            if resource.get("type")=="connection":
                connections.append(resource.get("id"))
            if resource.get("type")=="agent":
                agents.append(resource.get("id"))

        folders_details = UserFolder.query.filter(UserFolder.id.in_(agents)).all()
        connections_details = Connection.query.filter(Connection.id.in_(connections)).all()
        folder_insert_values = []
        conn_insert_values = []
        c_user = current_user.id
        
        


        for folder in folders_details:
            folder_insert_values.append({
            'name': folder.name,
            'shared_by': current_user.email,
            'user_id': to_user,
            "admin_id" : current_user.id,
            "folder_id":folder.id,
            'created_at': datetime.now(),
            'total_files': folder.total_files,
            'file_types_json': folder.file_types_json,
            'status': 'active',
            'folder_location': f"uploads/user_{c_user}/folder_{folder.id}",
            'created_at': datetime.now()
          })

        db.session.bulk_insert_mappings(SharedFolder, folder_insert_values)
        db.session.commit() 

        for conn in connections_details:
            conn_insert_values.append({
            'name': conn.name,
            'shared_by': current_user.email,
            'user_id': to_user,
            "admin_id" : current_user.id,
            "connection_id": conn.id,
            'host':conn.host,
            'database':conn.database,
            'db_user': conn.db_user,
            'password':conn.password,
            'port':conn.port,
            'db_system':conn.db_system,
            'status': 'active',
            'created_at': datetime.now()
          })
        db.session.bulk_insert_mappings(SharedConnection, conn_insert_values)
        db.session.commit() 

        ## SharedFolder
        ## name,shared_by,user_id ,created_at ,total_files ,file_types_json, status ,folder_location 

        ## SharedConnection
        ## user_id ,name ,shared_by ,host ,database ,db_user ,password, port ,created_at ,db_system, status
        print("folder_insert_values",folder_insert_values)
        print("conn_insert_values",conn_insert_values)
        db.session.close()

        return jsonify({"message": "Registered successfully", "data":{}}), 200
    except Exception as e:
        print("error", e)
        return jsonify({'success': False, 'error': 'server error'}), 404
    

@admin.route('/api/remove-resources', methods=["PUT"])
def remove_conn_and_fol():
    try: 
        data = request.get_json()
        print("remove connection data",data)
        folder_ids = []
        connection_ids = []

        # remove connection data {'user_id': '1', 'resource_ids': ['connection_27', 'agent_32', 'agent_31']}
        for resource in data.get("resource_ids"):
            tname = resource.split("_")[0]
            id = resource.split("_")[1]
            if "connection"==tname:
                connection_ids.append(id)
            if "agent"==tname:
                folder_ids.append(id)


        shared_folders = SharedFolder.query.filter(
            SharedFolder.user_id == data.get("user_id"),
            SharedFolder.folder_id.in_(folder_ids)
        ).all()

        # Update the status of each shared folder
        for folder in shared_folders:
            folder.status = 'inactive'

        # Get the shared connections to update
        shared_connections = SharedConnection.query.filter(
            SharedConnection.user_id == data.get("user_id"),
            SharedConnection.connection_id.in_(connection_ids)
        ).all()

        # Update the status of each shared connection
        for connection in shared_connections:
            connection.status = 'inactive'

        # Commit the changes
        db.session.commit()
        db.session.close()
        return jsonify({"success" : True, "message": " Permission removed successfully", "data":{}}), 200
    except Exception as e:
        print("error", e)
        return jsonify({'success': False, 'error': 'server error'}), 404
    

@admin.route('/api/invite', methods=['POST'])
def send_invite():
    data = request.json
    print("Invite-data", data)
    email = data.get('email')
    folder_ids = []
    connection_ids = []

    # remove connection data {'user_id': '1', 'resource_ids': ['connection_27', 'agent_32', 'agent_31']}
    for resource in data.get("resource_ids"):
        tname = resource.split("_")[0]
        id = resource.split("_")[1]
        if "connection"==tname:
            connection_ids.append(id)
        if "agent"==tname:
            folder_ids.append(id)

    if not email:
        return jsonify({'error': 'Email is required'}), 400

    existing_user = User.query.filter_by(email=email).first()
    c_user = current_user.id

    # get conenction and agent information
    folders_details = UserFolder.query.filter(UserFolder.id.in_(folder_ids)).all()
    connections_details = Connection.query.filter(Connection.id.in_(connection_ids)).all()
    folder_insert_values = []
    conn_insert_values = []

    if existing_user:
        user_id = existing_user.id

    else:
        new_user = User(email=email, password=password, role="user")
        db.session.add(new_user)
        db.session.commit()
        user_id = new_user.id


    for folder in folders_details:
            folder_insert_values.append({
            'name': folder.name,
            'shared_by': current_user.email,
            'user_id': user_id,
            "admin_id" : current_user.id,
            "folder_id":folder.id,
            'created_at': datetime.now(),
            'total_files': folder.total_files,
            'file_types_json': folder.file_types_json,
            'status': 'active',
            'folder_location': f"uploads/user_{c_user}/folder_{folder.id}",
            'created_at': datetime.now()
        })

    db.session.bulk_insert_mappings(SharedFolder, folder_insert_values)
    db.session.commit() 

    for conn in connections_details:
        conn_insert_values.append({
        'name': conn.name,
        'shared_by': current_user.email,
        'user_id': user_id,
        "admin_id" : current_user.id,
        "connection_id": conn.id,
        'host':conn.host,
        'database':conn.database,
        'db_user': conn.db_user,
        'password':conn.password,
        'port':conn.port,
        'db_system':conn.db_system,
        'status': 'active',
        'created_at': datetime.now()
        })
    db.session.bulk_insert_mappings(SharedConnection, conn_insert_values)
    db.session.commit() 

    

    connection_names = db.session.query(Connection).filter(
        Connection.id.in_(connection_ids)
    ).all()

    connection_dict = {conn.id: conn.name for conn in connection_names}

    # Query SharedFolder names
    folder_nam = db.session.query(UserFolder).filter(
        UserFolder.id.in_(folder_ids)
    ).all()

    folder_dict = {folder.id: folder.name for folder in folder_nam}
    connection_names = list(connection_dict.values())
    topic_names = list(folder_dict.values())
    print("connection_names",connection_names)
    print("topic_names", topic_names)
    # New user, send invite email with login credentials
    username = email
    password = generate_password(8)

    # new_user = User(email=email, password=password, role="user")
    # db.session.add(new_user)
    # db.session.commit()
    # user_id = new_user.id
    db.session.close()

    msg = Message('Login Credentials',
                    sender=current_app.config['MAIL_USERNAME'],
                    recipients=[email])
    msg.html = f"""
        Dear User,

        <p>You have been invited to login to our application.</p>

        <p>Your login credentials are:</p>

        <ul>
            <li><strong>Username:</strong> {username}</li>
            <li><strong>Password:</strong> {password}</li>
        </ul>

        <p>You have been granted permission to access the following folders and databases:</p>

        <ul>
            <li><strong>Databases:</strong> {",".join(connection_names)}</li>
            <li><strong>Topics:</strong>{",".join(topic_names)}</li>
        </ul>

        <p>Please click the following link to login:</p>

        <p><a href="http://192.168.1.8:5001/login" style="background-color: #2d6179; color: #fff; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; text-decoration: none;">Login to iDashboard</a></p>

        <p>Best regards,<br>GETO</p>
    """
    try:
        mail.send(msg)
        return jsonify({'message': 'Credentials have been shared by email.', "success": True}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500