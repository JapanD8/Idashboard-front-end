# app/routes.py
from flask import Blueprint, request, render_template, redirect, url_for, jsonify, session, render_template_string
#from .models import User
#from . import db
from flask_login import login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash

import uuid
from itertools import chain
from datetime import datetime
active_connections = {}

main = Blueprint("main", __name__)



@main.route('/')
def home():
    return render_template('base.html')


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
            # email = data.get("email")
            # password = data.get("password")

           
            new_session_id = str(uuid.uuid4())
            return jsonify({'session_id': new_session_id,"user_id":1})
            # else:
            #     # Create a new session ID if it doesn't exist
            #     new_session_id = str(uuid.uuid4())
                
            #     return jsonify({'session_id': new_session_id, "user_id":user_id})
            #     #return jsonify({"message": "Login successful"}), 200
            # return jsonify({"message": "Invalid credentials"}), 401

    return render_template("login.html")


@main.route("/dashboard")
def dashboard():
    #return f"Welcome {current_user.email}"
    return render_template("dashboard_base.html", email="temp@gmail.com")

@main.route("/chat")
def chat():
    #return f"Welcome {current_user.email}"
    return render_template("chat-new.html ", email="temp@gmail.com")

@main.route("/adddatabase")
def add_database_new():
    #return f"Welcome {current_user.email}"
    return render_template("add_database_new.html ", email="temp@gmail.com")

@main.route("/adddatabaseform")
def add_database_form():
    #return f"Welcome {current_user.email}"
    return render_template("add_database_form.html ", email="temp@gmail.com")

@main.route("/documentation")
def documentation():
    #return f"Welcome {current_user.email}"
    return render_template("documentation.html ", email="temp@gmail.com")   

@main.route("/dashboardnew")
def dashboard_new():
    #return f"Welcome {current_user.email}"
    return render_template("dashboard-new.html ", email="temp@gmail.com")   

@main.route("/databases")
def databases():
  
        #connections = Connection.query.filter_by(user_id=current_user.id).all()
    class FakeConnection:
        def __init__(self, id, name, host, database, db_user, password, port, created_at, db_system):
            self.id = id
            self.name = name
            self.host = host
            self.database = database
            self.db_user = db_user
            self.password = password
            self.port = port
            self.created_at = created_at
            self.db_system = db_system

    connections = [
    FakeConnection(
        id=2,
        name="Sales DB",
        host="192.168.1.100",
        database="sales_db",
        db_user="sales_user",
        password="secret123",
        port=3306,
        created_at=datetime(2024, 12, 1, 10, 30),
        db_system="MySQL"
    ),
    FakeConnection(
        id=3,
        name="Marketing DB",
        host="192.168.1.101",
        database="marketing_db",
        db_user="marketing_user",
        password="secret456",
        port=5432,
        created_at=datetime(2024, 12, 2, 9, 15),
        db_system="PostgreSQL"
    )
]

    return render_template('db_list.html', connections=connections, email="temp@gmail.com")
    # else:
    #     return redirect(url_for('/login'))


@main.route("/connection_form")

def connection_form():
    return render_template("connection_form.html")



######## ----dblist  page routings------



@main.route("/add-database")

def add_database():
    return render_template("add_database.html", email="temp@gmail.com")



@main.route("/logout")
def logout():
    logout_user()
    return redirect("/login")


@main.route('/connections/<int:connection_id>/post', methods=['POST'])
def connect_connection(connection_id):
    return jsonify({'success': True})
  
@main.route('/connections/<int:connection_id>/delete', methods=['DELETE'])
def disconnect_connection(connection_id):
    
    return jsonify({'success': True})
   

