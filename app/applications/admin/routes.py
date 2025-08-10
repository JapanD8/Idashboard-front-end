# app/routes.py
from flask import Blueprint, request, render_template, redirect, url_for, jsonify, session, render_template_string, current_app
from app.models import User, Connection, ChatSession, Message,ChartData, AccesstokenData, UserFolder
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
active_connections = {}

#admin = Blueprint('admin', __name__)
admin = Blueprint('admin', __name__, url_prefix='/admin')


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
    for user in users:
        user_list.append({
            "id" :user.id,
            "email" : user.email
        })
    print("user_list", user_list)
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
        connectionResources = [
                { 
                    "id": 'conn_1', 
                    "name": 'Insurance Database', 
                    "type": 'PostgreSQL',
                    "owner": 'admin',
                    "host": 'localhost',
                    "port": '5432',
                    "database": 'insurance_db',
                    "created": '2025-06-23',
                    "shared_with": ['john.doe', 'jane.smith']
                },
                { 
                    "id": 'conn_2', 
                    "name": 'Host INSDB', 
                    "type": 'MySQL',
                    "owner": 'admin',
                    "host": 'host.docker.internal',
                    "port": '3306',
                    "database": 'insdb',
                    "created": '2025-06-27',
                    "shared_with": ['mike.wilson']
                },
                { 
                    "id": 'conn_3', 
                    "name": 'Order Database', 
                    "type": 'PostgreSQL',
                    "owner": 'john.doe',
                    "host": 'test-postgres-public.cfswmgecgaow.us-west-2.rds.amazonaws.com',
                    "port": '5432',
                    "database": 'orders_db',
                    "created": '2025-07-02',
                    "shared_with": ['sarah.johnson']
                },
                { 
                    "id": 'conn_4', 
                    "name": 'Restaurant System', 
                    "type": 'MongoDB',
                    "owner": 'jane.smith',
                    "host": 'restaurant-cluster.mongodb.net',
                    "port": '27017',
                    "database": 'restaurant_db',
                    "created": '2025-07-23',
                    "shared_with": ['david.brown']
                },
                { 
                    "id": 'conn_5', 
                    "name": 'Analytics Warehouse', 
                    "type": 'Snowflake',
                    "owner": 'admin',
                    "host": 'analytics.snowflakecomputing.com',
                    "port": '443',
                    "database": 'warehouse_db',
                    "created": '2025-07-30',
                    "shared_with": []
                }
            ]
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
    agentResources = [
            { 
                "id": 'agent_1', 
                "name": 'Dock Agent', 
                "type": 'AI Agent',
                "owner": 'admin',
                "description": 'Dock Management System',
                "endpoint": 'dock.agent.internal',
                "model": 'GPT-4',
                "created": '2025-07-30',
                "shared_with": ['john.doe', 'mike.wilson']
            },
            { 
                "id": 'agent_2', 
                "name": 'HR Agent', 
                "type": 'AI Agent',
                "owner": 'admin',
                "description": 'Human Resources System',
                "endpoint": 'hr.agent.internal',
                "model": 'Claude-3',
                "created": '2025-07-29',
                "shared_with": ['jane.smith']
            },
            { 
                "id": 'agent_3', 
                "name": 'Finance Agent', 
                "type": 'AI Agent',
                "owner": 'sarah.johnson',
                "description": 'Financial Management System',
                "endpoint": 'finance.agent.internal',
                "model": 'GPT-4',
                "created": '2025-07-28',
                "shared_with": ['david.brown']
            },
            { 
                "id": 'agent_4', 
                "name": 'Customer Support Agent', 
                "type": 'AI Agent',
                "owner": 'john.doe',
                "description": 'Customer Service Assistant',
                "endpoint": 'support.agent.internal',
                "model": 'Claude-3',
                "created": '2025-07-27',
                "shared_with": []
            },
            { 
                "id": 'agent_5', 
                "name": 'Data Analysis Agent', 
                "type": 'AI Agent',
                "owner": 'admin',
                "description": 'Data Analytics and Reporting',
                "endpoint": 'analytics.agent.internal',
                "model": 'GPT-4',
                "created": '2025-07-26',
                "shared_with": ['mike.wilson', 'sarah.johnson']
            }
        ]
    return jsonify({"message": "Registered successfully", "data":folder_list}), 200