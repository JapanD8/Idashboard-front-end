from google import genai
from .models import User, Connection, ChatSession, Message, AccesstokenData
import mysql.connector
import pandas as pd
import json
import psycopg2
from dotenv import load_dotenv
import os
import jwt
import datetime
from collections import defaultdict
import uuid
from . import db

from .ai_models import QwenChatClient
from .chart_processing import ChartDataProcessor

def create_access_token(user_id, db_id):
    payload = {
        'user_id': user_id,
        'exp': datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=30)
    }
    secret_key = str(uuid.uuid4())[:8]
    token = jwt.encode(payload, secret_key, algorithm='HS256')
    schema = schema_for_api_calls(user_id,db_id)
    print(schema)
    # connection = AccesstokenData(
    #             user_id = user_id,
    #             db_id = db_id,
    #             token = token,
    #             secret_key = secret_key,
    #             schema = schema
    #             )

    connection = AccesstokenData.query.filter_by(user_id=user_id, db_id=db_id).first()
    if connection:
        # 🔁 Update existing record
        connection.token = token
        connection.secret_key = secret_key
        connection.schema = schema
    else: 
        connection = AccesstokenData(
            user_id=user_id,
            db_id=db_id,
            token=token,
            secret_key=secret_key,
            schema=schema
        )
        db.session.add(connection)
    db.session.commit()
    return token, secret_key


def validate_access_token(token):
    print("token-----",token)
    token_data = AccesstokenData.query.filter_by(token=token).first()
    if token_data:
        secret_key = token_data.secret_key  
        try:
            payload = jwt.decode(token, secret_key, algorithms=['HS256'])
            return payload, token_data.user_id, token_data.db_id, token_data.schema
        except jwt.ExpiredSignatureError:
            return {'error': 'Token has expired'}
        except jwt.InvalidTokenError:
            return {'error': 'Invalid token'}
    else:
        return {'error': 'Token not found'}

def generate_unique_embed_id():
    return str(uuid.uuid4())[:8]

def re_get_connection(connection_id, user_id):
    active_connections = {}
    connection = Connection.query.filter_by(id=connection_id, user_id=user_id).first()
    
    if not connection:
         return {}, connection_id, "cannnot connect to db"

    try:
        print(repr(connection.name))
        if connection.db_system == "PostgreSQL":
            conn = psycopg2.connect(
                dbname=connection.database,
                user=connection.db_user,
                password=connection.password,
                host=connection.host,
                port=connection.port,
                connect_timeout = 30  # seconds
            )
            # Save this connection in the global dict using (user_id, connection_id) as key
            active_connections[(user_id, connection_id)] = conn
            print("active_connections",len(active_connections))
        if connection.db_system == "MySQL":
            # Establish the connection to the third-party database
            conn = mysql.connector.connect(
                host=connection.host,
                port=connection.port,
                database=connection.database,
                user=connection.db_user,
                password=connection.password,
                connect_timeout = 30 # seconds
            )

            # Save this connection in the global dict using (user_id, connection_id) as key
            active_connections[(user_id, connection_id)] = conn
            print("active_connections",len(active_connections))
        return active_connections, connection.database, connection.db_system
    except Exception as e:
        return {}, connection_id, e
    


def get_processed_data(schmea, user_question,user_id,connection_id):
    active_connections = {}
    print(len(active_connections))
    if  len(active_connections)==0:
        active_connections, db_name, db_system = re_get_connection(connection_id, user_id)

    load_dotenv()
    gemini_key = os.getenv("GEMINI_Key")
    client = genai.Client(api_key=gemini_key)
    if (user_id, connection_id) not in active_connections:
        print("active_connections empty")
        print("error" , db_system)
        return 404, {}
    

    print("user_id, connection_id",user_id, connection_id)
    print(schmea)
    conn = active_connections[(user_id, connection_id)]
    cursor = conn.cursor()
    data ={} 
    if db_system=="MySQL":
        new_content = f""" Role: You are an amazing AI will act as a SQL query generator and data visualization consultant.

            Task: Generate a SQL query and recommend a suitable chart type based on user-defined column names and their corresponding types.

            Input Specifications:
            {schmea}
            2. User Question: {user_question}.

            Output Format: The output should be in JSON format structured as follows:
            - 'query': The generated SQL query string.
            - 'chart_type': The recommended chart type (options: "metric","bar","stackBar","pie","donut","radar",line,"table","funnel"). #Note: if the chartype asked by user not in the list - recommend the best one
            - 'x_axis': The name of the x-axis for the chart.
            - 'y_axis': The name of the y-axis for the chart.
            - 'title': A descriptive title for the chart."""+"""
            Constraints:
            - Always provide a single SQL query.
            - If the user specifies a chart type, use that type; otherwise, choose an appropriate type based on the query.
            - Note: For a query resulting in a single numerical or string value, use "metric" as the chart type; for queries with more than two values, use "bar" or "pie".
            - Ensure all keys in the JSON output are filled; do not leave any empty.
            - If the user asks a question related to [inserting or updating or deleting]  data, set the title, x_axis, y_axis, and query to null, and return only a message like "This action is not allowed.


            Example Input:
            - Table Name : Insurance
            - Column Types: `{"gender": "string", "policy_count": "integer"}`
            - User Question: "How many policies are taken by each gender?"

            Example Output:
            {
            "query": "SELECT gender, COUNT(*) as policy_count FROM Insurance GROUP BY gender;",
            "chart_type": "bar",
            "x_axis": "gender",
            "y_axis": "Policy Count",
            "title": "Policy Count by Gender"
            }
            Note: Avoid Question asked from ouside of Tables, Reply with politely, that time only keep title, set x_axis,y_axis,chart_type and query set null.
            """

        response = client.models.generate_content(
        model="gemini-2.0-flash", contents= new_content
        )
        print(response.text)
        response_text = response.text
        json_data = json.loads(response_text.split("json")[1].split("```")[0])
        #pjson_data = json.load(json_data)
        print(type(json_data))
        #result  = eval(json_data.get("query"))
        #result = st.session_state.con.execute(json_data.get("query")).fetchdf()
        
        if json_data.get("x_axis")==None and json_data.get("y_axis")==None and json_data.get("query")==None:
            return json_data.get("title"), {}
        
        if json_data.get("query"):
            print("delete" in  json_data.get("query").lower() or "update" in  json_data.get("query").lower())
            if "delete" in  json_data.get("query").lower() or "update" in  json_data.get("query").lower():
                return "No update ot delete allowed try asking different question", {}
            
        result = pd.read_sql_query(json_data.get("query"), conn)

        print(result)
    if db_system=="PostgreSQL":
        new_content = f""" Role: You are an amazing AI will act as a {db_system} query generator and data visualization consultant.

            Task: Generate a {db_system} query and recommend a suitable chart type based on user-defined column names and their corresponding types.

            Input Specifications:
            {schmea}
            2. User Question: {user_question}.

            Output Format: The output should be in JSON format structured as follows:
            - 'query': The generated SQL query string.
            - 'chart_type': The recommended chart type (options: "metric","bar","stackBar","pie","donut","radar",line,"table","funnel"). #Note: if the chartype asked by user not in the list - recommend the best one
            - 'x_axis': The name of the x-axis for the chart.
            - 'y_axis': The name of the y-axis for the chart.
            - 'title': A descriptive title for the chart."""+"""
            Constraints:
            - Always provide a single SQL query.
            - If the user specifies a chart type, use that type; otherwise, choose an appropriate type based on the query.
            - Note: For a query resulting in a single numerical or string value, use "metric" as the chart type; for queries with more than two values, use "bar" or "pie".
            - Ensure all keys in the JSON output are filled; do not leave any empty.
            - If the user asks a question related to [inserting or updating or deleting]  data, set the title, x_axis, y_axis, and query to null, and return only a message like "This action is not allowed.


            Example Input:
            - Table Name : table_name
            - Column Types: `{"gender": "string", "policy_count": "integer"}`
            - User Question: "How many policies are taken by each gender?"

            Example Output:
            {
            "query": " SELECT gender, COUNT(*) AS policy_count FROM table_name GROUP BY gender;;",
            "chart_type": "bar",
            "x_axis": "gender",
            "y_axis": "Policy Count",
            "title": "Policy Count by Gender"
            }
            Note : Avoid Question asked from ouside of Tables, Reply with politely, that time only keep title, set x_axis,y_axis,chart_type and query set null.
            """
        response = client.models.generate_content(
        model="gemini-2.0-flash", contents= new_content
        )
        print(response.text)
        response_text = response.text
        json_data = json.loads(response_text.split("json")[1].split("```")[0])
        #pjson_data = json.load(json_data)
        print(type(json_data))
        #result  = eval(json_data.get("query"))
        #result = st.session_state.con.execute(json_data.get("query")).fetchdf()
        
            

        if json_data.get("x_axis")==None and json_data.get("y_axis")==None and json_data.get("query")==None:
            return json_data.get("title"), {}
        if json_data.get("query"):
            print("delete" in  json_data.get("query").lower() or "update" in  json_data.get("query").lower())
            if "delete" in  json_data.get("query").lower() or "update" in  json_data.get("query").lower():
                return "No update ot delete allowed try asking different question", {}
        result = pd.read_sql_query(json_data.get("query"), conn)
    


        print(result)
    if json_data.get("chart_type")=="metric":
        s=1
        promt = f"""
        You are summarizer an AI tool specializing in ultra-concise, context-aware summaries. Your task is to generate a summary of the provided Answer that directly addresses the User Question, while ignoring irrelevant details.
        User Question: {user_question}
        Answer: {result}
        DO:
        - Extract only the core information from the Answer that answers the User Question.
        - Summarize in 1 sentence (max 15 words).
        - Use neutral, factual language.
        - Preserve critical numbers/dates if present.

        DON'T:
        - Add opinions, examples, or new information.
        - Repeat the question.
        - Use bullet points or markdown.
        Example:
            User Question:
            What was the total claim amount submitted by user A in Q3 2024?
            Answer:
            sum(claim)
            0 $4,200
            Output:
            User A's total Q3 2024 claims were $4,200.
        """

        response = client.models.generate_content(
        model="gemini-2.0-flash", contents= promt)
        print("summarizer",response.text)
        data["message"] = response.text
    if json_data.get("chart_type")=="pie":
       
        # "data": {
        #         "message": "Market share distribution.",
        #         "chart_type": "pie",
        #         "chart_data": {
        #         "title": "Market Share",
        #         "labels": ["Company A", "Company B", "Company C"],
        #         "values": [40, 35, 25]
        #         }
        #     }
        columns = result.columns
        data["message"] = json_data.get("title")
        data["chart_type"] = "pie"
        data["chart_data"]={}
        data["chart_data"]["title"] = json_data.get("title")
        data["chart_data"]["labels"] = result[columns[0]].tolist()
        data["chart_data"]["values"] = result[columns[1]].tolist()

    if json_data.get("chart_type")=="funnel":
        columns = result.columns
        pre_data = {
        'title': 'Funnel Chart',
        'datasets': result.apply(lambda row: {'label': row[columns[0]], 'values': [row[columns[1]]]}, axis=1).tolist()}

        data["message"] = json_data.get("title")
        data["chart_type"] = "funnel"
        data["chart_data"]=pre_data
        data["chart_data"]["title"] = json_data.get("title")
        data["chart_data"]["x_axis"] = json_data.get("x_axis")
        data["chart_data"]["y_axis"] = json_data.get("y_axis")
        
        

    if json_data.get("chart_type")=="bar":
        columns = result.columns
        print("columns",list(columns))
        column_names = list(columns)
        if len(column_names)==2:
            # "data": {
            #         "message": "Here is the sales chart.",
            #         "chart_type": "bar",
            #         "chart_data": {
            #         "title": "Sales by Month",
            #         "labels": ["Jan", "Feb", "Mar"],
            #         "values": [120, 190, 300]
            #         }
            #     }
            data["message"] = json_data.get("title")
            data["chart_type"] = "bar"
            data["chart_data"]={}
            data["chart_data"]["title"] = json_data.get("title")
            data["chart_data"]["labels"] = result[columns[0]].tolist()
            data["chart_data"]["values"] = result[columns[1]].tolist()
            data["chart_data"]["x_axis"] = json_data.get("x_axis")
            data["chart_data"]["y_axis"] = json_data.get("y_axis")
            
        if len(column_names)==3:
            #  "data": {
            #         "message": "Combined bar and line chart.",
            #         "chart_type": "barWithLine",
            #         "chart_data": {
            #         "title": "Sales vs Target",
            #         "labels": ["Jan", "Feb", "Mar"],
            #         "values": [120, 190, 300],
            #         "lineValues": [150, 200, 320]
            #         }
            #     }
            # 1. Check data types
            col1_str = pd.api.types.is_string_dtype(result.iloc[:, 0])
            col2_str = pd.api.types.is_string_dtype(result.iloc[:, 1])
            col3_num = pd.api.types.is_numeric_dtype(result.iloc[:, 2])
            if (col1_str and col2_str and col3_num):
               
                # 2. Pivot the data
                pivot_df = result.pivot_table(
                    index=result.columns[0], 
                    columns=result.columns[1], 
                    values=result.columns[2],
                    aggfunc='sum',
                    fill_value=0
                )

                # 3. Create the dictionary
                unique_states = pivot_df.index.tolist()
                unique_products = pivot_df.columns.tolist()

                sales_dict = {}
                for product in unique_products:
                    sales_dict[product] = pivot_df[product].tolist()
            else:
                print("bar with line entered")
                data["message"] = json_data.get("title")
                data["chart_type"] = "barWithLine"
                data["chart_data"]={}
                data["chart_data"]["title"] = json_data.get("title")
                data["chart_data"]["labels"] = result[columns[0]].tolist()
                data["chart_data"]["values"] = result[columns[1]].tolist()
                data["chart_data"]["lineValues"] = result[columns[2]].tolist()
                data["chart_data"]["bar_name"] = columns[1]
                data["chart_data"]["line_name"] = columns[2]

        if len(column_names)>3:
           
            data["message"] = json_data.get("title")
            data["chart_type"] = "barWithMultipleLine"
            data["chart_data"]={}
            data["chart_data"]["title"] = json_data.get("title")
            data["chart_data"]["bar_name"] = columns[1]
            data["chart_data"]["labels"] = result[columns[0]].tolist()
            data["chart_data"]["values"] = result[columns[1]].tolist()
            data["chart_data"]["line_datasets"] = []
            for i in range(2,len(columns)):
                data["chart_data"]["line_datasets"].append({ "label": columns[i] , "values":  result[columns[i]].tolist()})

    if json_data.get("chart_type")=="stackBar":
        # "data": {
        #         "message": "Stacked sales chart.",
        #         "chart_type": "stackBar",
        #         "chart_data": {
        #         "title": "Sales by Region",
        #         "labels": ["North", "South", "East"],
        #         "datasets": [
        #             { "label": "Product A", "values": [120, 190, 300] },
        #             { "label": "Product B", "values": [80, 110, 150] }
        #         ]
        #         }
        #     }
        columns = result.columns
        print("columns",list(columns))
        column_names = list(columns)
        if len(column_names)==3:
            #  "data": {
            #         "message": "Combined bar and line chart.",
            #         "chart_type": "barWithLine",
            #         "chart_data": {
            #         "title": "Sales vs Target",
            #         "labels": ["Jan", "Feb", "Mar"],
            #         "values": [120, 190, 300],
            #         "lineValues": [150, 200, 320]
            #         }
            #     }
            # 1. Check data types
            col1_str = pd.api.types.is_string_dtype(result.iloc[:, 0])
            col2_str = pd.api.types.is_string_dtype(result.iloc[:, 1])
            col3_num = pd.api.types.is_numeric_dtype(result.iloc[:, 2])
            print("(col1_str and col2_str and col3_num)",(col1_str and col2_str and col3_num))
            if (col1_str and col2_str and col3_num):
               
                # 2. Pivot the data
                pivot_df = result.pivot_table(
                    index=result.columns[0], 
                    columns=result.columns[1], 
                    values=result.columns[2],
                    aggfunc='sum',
                    fill_value=0
                ).reset_index()

                # 3. Create the dictionary
                unique_states = pivot_df.index.tolist()
                unique_products = pivot_df.columns.tolist()
                data["message"] = json_data.get("title")
                data["chart_type"] = "stackBar"
                data["chart_data"]={}
                data["chart_data"]["title"] = json_data.get("title")
                data["chart_data"]["labels"] =  pivot_df[result.columns[0]].tolist()
                data["chart_data"]["datasets"] = []

                sales_dict = {}
                for product in pivot_df.columns[1:]:
                    data["chart_data"]["datasets"].append({"label": product,"values": pivot_df[product].tolist()})
            col1_str = pd.api.types.is_string_dtype(result.iloc[:, 0])
            col2_str = pd.api.types.is_numeric_dtype(result.iloc[:, 1])
            col3_num = pd.api.types.is_numeric_dtype(result.iloc[:, 2])
            if (col1_str and col2_str and col3_num):
                data["message"] = json_data.get("title")
                data["chart_type"] = "stackBar"
                data["chart_data"]={}
                data["chart_data"]["title"] = json_data.get("title")
                data["chart_data"]["labels"] = result[columns[0]].tolist()
                data["chart_data"]["datasets"] = []
                for i in range(1,len(columns)):
                    data["chart_data"]["datasets"].append({ "label":  columns[i], "values":  result[columns[i]].tolist()})
            

        if len(column_names)>3:
            data["message"] = json_data.get("title")
            data["chart_type"] = "stackBar"
            data["chart_data"]={}
            data["chart_data"]["title"] = json_data.get("title")
            data["chart_data"]["labels"] = result[columns[0]].tolist()
            data["chart_data"]["datasets"] = []
            for i in range(1,len(columns)):
                data["chart_data"]["datasets"].append({ "label":  columns[i], "values":  result[columns[i]].tolist()})

        
        

    if json_data.get("chart_type")=="barWithMultipleLine":
        #     "data": {
        #     "message": "Here's the combined bar and multi-line chart.",
        #     "chart_type": "barWithMultipleLine",
        #     "chart_data": {
        #     "title": "Sales vs Forecast vs Budget",
        #     "labels": ["Jan", "Feb", "Mar"],
        #     "values": [120, 190, 300], // Bar values
        #     "line_datasets": [
        #         {
        #         "label": "Forecast",
        #         "values": [130, 180, 310]
        #         },
        #         {
        #         "label": "Budget",
        #         "values": [100, 170, 290]
        #         }
        #     ]
        #     }
        # }
        columns = result.columns
        print("columns",list(columns))
        column_names = list(columns)
        if len(column_names)==3:
            data["message"] = json_data.get("title")
            data["chart_type"] = "barWithMultipleLine"
            data["chart_data"]={}
            data["chart_data"]["title"] = json_data.get("title")
            data["chart_data"]["labels"] = result[columns[0]].tolist()
            data["chart_data"]["values"] = result[columns[1]].tolist()
            data["chart_data"]["line_datasets"] = []
            for i in range(2,len(columns)):
                data["chart_data"]["line_datasets"].append({ "label": columns[i] , "values":  result[columns[i]].tolist()})

    if json_data.get("chart_type")=="wordCloud":
        #     "data": {
        #     "message": "Here is the word cloud.",
        #     "chart_type": "wordCloud",
        #     "chart_data": {
        #     "title": "Popular Technologies",
        #     "words": [
        #         { "text": "JavaScript", "weight": 10 },
        #         { "text": "React", "weight": 8 },
        #         { "text": "Node.js", "weight": 7 }
        #     ]
        #     }
        # }
        columns = result.columns
        print("columns",list(columns))
        column_names = list(columns)
        data["message"] = json_data.get("title")
        data["chart_type"] = "wordCloud"
        data["chart_data"]={}
        data["chart_data"]["title"] = json_data.get("title")
        data["chart_data"]["words"] = []
        labels = result[columns[0]].tolist()
        values = result[columns[1]].tolist()
        for i in range(len(labels)):
            data["chart_data"]["words"].append({ "text": labels[i] , "weight": values[i]})

    if json_data.get("chart_type")=="donut":
        #     {
        #   "success": true,
        #   "data": {
        #     "message": "Here is the donut chart.",
        #     "chart_type": "donut",
        #     "chart_data": {
        #       "title": "Market Share",
        #       "labels": ["Company A", "Company B", "Company C"],
        #       "values": [40, 35, 25]
        #     }
        #   }
        # }
        s=1
        columns = result.columns
        data["message"] = json_data.get("title")
        data["chart_type"] = "donut"
        data["chart_data"]={}
        data["chart_data"]["title"] = json_data.get("title")
        data["chart_data"]["labels"] = result[columns[0]].tolist()
        data["chart_data"]["values"] = result[columns[1]].tolist()

    if json_data.get("chart_type")=="table":
        #     {
        #   "success": true,
        #   "data": {
        #     "message": "Here is the donut chart.",
        #     "chart_type": "donut",
        #     "chart_data": {
        #       "title": "Market Share",
        #       "labels": ["Company A", "Company B", "Company C"],
        #       "values": [40, 35, 25]
        #     }
        #   }
        # }
        s=1
        columns = result.columns
        data["message"] = json_data.get("title")
        data["chart_type"] = "table"
        data["chart_data"]={}
        data["chart_data"]["title"] = json_data.get("title")
        data["chart_data"]["datasets"] =[]
        for i in range(0,len(columns)):
             data["chart_data"]["datasets"].append({ "label":  columns[i], "values":  result[columns[i]].tolist()})

    if json_data.get("chart_type")=="radar":
        # # {
        # #   "success": true,
        # #   "data": {
        # #     "message": "Here is the radar chart.",
        # #     "chart_type": "radar",
        # #     "chart_data": {
        # #       "title": "Skill Assessment",
        # #       "labels": ["HTML", "CSS", "JS", "Python", "SQL"],
        # #       "values": [90, 85, 95, 70, 60]
        # #     }
        # #   }
        # s=1
        # columns = result.columns
        # data["message"] = json_data.get("title")
        # data["chart_type"] = "radar"
        # data["chart_data"]={}
        # data["chart_data"]["title"] = json_data.get("title")
        # data["chart_data"]["labels"] = result[columns[0]].tolist()
        # data["chart_data"]["values"] = result[columns[1]].tolist()
        

  
        # "data": {
        #     "message": "Here's the radar chart.",
        #     "chart_type": "radar",
        #     "chart_data": {
        #     "title": "Skill Assessment",
        #     "labels": ["HTML", "CSS", "JS", "Python", "SQL"],
        #     "datasets": [
        #         {
        #         "label": "Developer A",
        #         "values": [90, 85, 95, 70, 60]
        #         },
        #         {
        #         "label": "Developer B",
        #         "values": [80, 80, 90, 65, 75]
        #         }
        #     ]
        #     }
        # }
        columns = result.columns
        column_names = list(columns)
        if len(column_names)==3:
            #  "data": {
            #         "message": "Combined bar and line chart.",
            #         "chart_type": "barWithLine",
            #         "chart_data": {
            #         "title": "Sales vs Target",
            #         "labels": ["Jan", "Feb", "Mar"],
            #         "values": [120, 190, 300],
            #         "lineValues": [150, 200, 320]
            #         }
            #     }
            # 1. Check data types
            col1_str = pd.api.types.is_string_dtype(result.iloc[:, 0])
            col2_str = pd.api.types.is_string_dtype(result.iloc[:, 1])
            col3_num = pd.api.types.is_numeric_dtype(result.iloc[:, 2])
            print("(col1_str and col2_str and col3_num)",(col1_str and col2_str and col3_num))
            if (col1_str and col2_str and col3_num):
               
                # 2. Pivot the data
                pivot_df = result.pivot_table(
                    index=result.columns[0], 
                    columns=result.columns[1], 
                    values=result.columns[2],
                    aggfunc='sum',
                    fill_value=0
                ).reset_index()

                # 3. Create the dictionary
                unique_states = pivot_df.index.tolist()
                unique_products = pivot_df.columns.tolist()
                data["message"] = json_data.get("title")
                data["chart_type"] = "radar"
                data["chart_data"]={}
                data["chart_data"]["title"] = json_data.get("title")
                data["chart_data"]["labels"] =  pivot_df[result.columns[0]].tolist()
                data["chart_data"]["datasets"] = []

                sales_dict = {}
                for product in pivot_df.columns[1:]:
                    data["chart_data"]["datasets"].append({"label": product,"values": pivot_df[product].tolist()})

            else:
                data["message"] = json_data.get("title")
                data["chart_type"] = "radar"
                data["chart_data"]={}
                data["chart_data"]["title"] = json_data.get("title")
                data["chart_data"]["labels"] = result[columns[0]].tolist()
                data["chart_data"]["datasets"] = []
                for i in range(1,len(columns)):
                    data["chart_data"]["datasets"].append({ "label":  columns[i], "values":  result[columns[i]].tolist()})
                data["chart_data"]["x_axis"] = json_data.get("x_axis")
                data["chart_data"]["y_axis"] = json_data.get("y_axis")
        else:
            data["message"] = json_data.get("title")
            data["chart_type"] = "radar"
            data["chart_data"]={}
            data["chart_data"]["title"] = json_data.get("title")
            data["chart_data"]["labels"] = result[columns[0]].tolist()
            data["chart_data"]["datasets"] = []
            for i in range(1,len(columns)):
                data["chart_data"]["datasets"].append({ "label":  columns[i], "values":  result[columns[i]].tolist()})
            data["chart_data"]["x_axis"] = json_data.get("x_axis")
            data["chart_data"]["y_axis"] = json_data.get("y_axis")


    if json_data.get("chart_type")=="line":
        # "data": {
        #     "message": "Here's the multi-line chart.",
        #     "chart_type": "line",
        #     "chart_data": {
        #     "title": "Sales vs Forecast",
        #     "labels": ["Jan", "Feb", "Mar"],
        #     "datasets": [
        #         {
        #         "label": "Actual Sales",
        #         "values": [120, 190, 300]
        #         },
        #         {
        #         "label": "Forecast",
        #         "values": [130, 180, 310]
        #         }
        #     ]
        #     }
        # }
        # s=1
        columns = result.columns
        column_names = list(columns)
        if len(column_names)==3:
            #  "data": {
            #         "message": "Combined bar and line chart.",
            #         "chart_type": "barWithLine",
            #         "chart_data": {
            #         "title": "Sales vs Target",
            #         "labels": ["Jan", "Feb", "Mar"],
            #         "values": [120, 190, 300],
            #         "lineValues": [150, 200, 320]
            #         }
            #     }
            # 1. Check data types
            col1_str = pd.api.types.is_string_dtype(result.iloc[:, 0])
            col2_str = pd.api.types.is_string_dtype(result.iloc[:, 1])
            col3_num = pd.api.types.is_numeric_dtype(result.iloc[:, 2])
            print("(col1_str and col2_str and col3_num)",(col1_str and col2_str and col3_num))
            if (col1_str and col2_str and col3_num):
               
                # 2. Pivot the data
                pivot_df = result.pivot_table(
                    index=result.columns[0], 
                    columns=result.columns[1], 
                    values=result.columns[2],
                    aggfunc='sum',
                    fill_value=0
                ).reset_index()

                # 3. Create the dictionary
                unique_states = pivot_df.index.tolist()
                unique_products = pivot_df.columns.tolist()
                data["message"] = json_data.get("title")
                data["chart_type"] = "line"
                data["chart_data"]={}
                data["chart_data"]["title"] = json_data.get("title")
                data["chart_data"]["labels"] =  pivot_df[result.columns[0]].tolist()
                data["chart_data"]["datasets"] = []

                sales_dict = {}
                for product in pivot_df.columns[1:]:
                    data["chart_data"]["datasets"].append({"label": product,"values": pivot_df[product].tolist()})
                data["chart_data"]["x_axis"] = json_data.get("x_axis")
                data["chart_data"]["y_axis"] = json_data.get("y_axis")
            else:
                data["message"] = json_data.get("title")
                data["chart_type"] = "line"
                data["chart_data"]={}
                data["chart_data"]["title"] = json_data.get("title")
                data["chart_data"]["labels"] = result[columns[0]].tolist()
                data["chart_data"]["datasets"] = []
                for i in range(1,len(columns)):
                    data["chart_data"]["datasets"].append({ "label":  columns[i], "values":  result[columns[i]].tolist()})
                data["chart_data"]["x_axis"] = json_data.get("x_axis")
                data["chart_data"]["y_axis"] = json_data.get("y_axis")
        else:
            data["message"] = json_data.get("title")
            data["chart_type"] = "line"
            data["chart_data"]={}
            data["chart_data"]["title"] = json_data.get("title")
            data["chart_data"]["labels"] = result[columns[0]].tolist()
            data["chart_data"]["datasets"] = []
            for i in range(1,len(columns)):
                data["chart_data"]["datasets"].append({ "label":  columns[i], "values":  result[columns[i]].tolist()})
            data["chart_data"]["x_axis"] = json_data.get("x_axis")
            data["chart_data"]["y_axis"] = json_data.get("y_axis")

    

    return True, data


def schema_for_api_calls(user_id, db_id):
    active_connections = {}
    connection_id = db_id
    db_system =""
    if len(active_connections)==0:
        print("Before active_connections length",len(active_connections))
        active_connections, db_name, db_system = re_get_connection(connection_id, user_id)
    print("After",len(active_connections), db_name)
    if (user_id, connection_id) not in active_connections:
        return {},
    schema_data = {}

    if db_system=="MySQL":
        conn = active_connections[(user_id, connection_id)]
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
        conn = active_connections[(user_id, connection_id)]
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

    return schema_data


def process_metric(user_question, result):
        
    # Generate a summary using the provided prompt
    prompt = f"""
    You are summarizer an AI tool specializing in ultra-concise, context-aware summaries. Your task is to generate a summary of the provided Answer that directly addresses the User Question, while ignoring irrelevant details.
    User Question: {user_question}
    Answer: {result}
    DO:
    - Extract only the core information from the Answer that answers the User Question.
    - Summarize in 1 sentence (max 15 words).
    - Use neutral, factual language.
    - Preserve critical numbers/dates if present.

    DON'T:
    - Add opinions, examples, or new information.
    - Repeat the question.
    - Use bullet points or markdown.
    Example:
        User Question:
        What was the total claim amount submitted by user A in Q3 2024?
        Answer:
        sum(claim)
        0 $4,200
        Output:
        User A's total Q3 2024 claims were $4,200.
    """
        
    # Assuming you have a function to generate the summary using the prompt
    # For demonstration purposes, we'll use a simple summary generation
    qwen = QwenChatClient()

    user_input = "Tell me a fun fact about pandas."
    summary = qwen.summary(prompt)
    
    return  summary




def get_reply_qwen(schmea, user_question,user_id,connection_id):
    active_connections = {}
    data ={}
    print(len(active_connections))
    if  len(active_connections)==0:
        active_connections, db_name, db_system = re_get_connection(connection_id, user_id)

    load_dotenv()
    gemini_key = os.getenv("GEMINI_Key")
    client = genai.Client(api_key=gemini_key)
    if (user_id, connection_id) not in active_connections:
        print("active_connections empty")
        print("error" , db_system)
        return 404, {}

    print("user_id, connection_id",user_id, connection_id)
   
    conn = active_connections[(user_id, connection_id)]
    cursor = conn.cursor()

    qwen = QwenChatClient()

    user_input = "Tell me a fun fact about pandas."
    reply = qwen.ask(user_question,db_system, schmea)
    print("reply from QWEn",reply)


    
    #pjson_data = json.load(json_data)
    if "json" in reply:
        json_data = json.loads(response_text.split("json")[1].split("```")[0])
    else:
        json_data = json.loads(reply)
    print(type(json_data))
    #result  = eval(json_data.get("query"))
    #result = st.session_state.con.execute(json_data.get("query")).fetchdf()
    
    if json_data.get("query")==None:
        return json_data.get("title"), {}
    if json_data.get("x_axis")==None and json_data.get("y_axis")==None and json_data.get("query")==None:
        return json_data.get("title"), {}
    
    if json_data.get("query"):
        print("delete" in  json_data.get("query").lower() or "update" in  json_data.get("query").lower())
        if "delete" in  json_data.get("query").lower() or "update" in  json_data.get("query").lower() or "insert" in  json_data.get("query").lower():
            return "No update , delete or insert allowed try asking different question", {}
        
    result = pd.read_sql_query(json_data.get("query"), conn)

    print(result)
    if json_data.get("chart_type")=="metric":
        json_data["user_question"]=user_question
        summary = process_metric(user_question, result)
        data["message"] = summary
    else:
        processor = ChartDataProcessor(json_data, result)
        success, data = processor.process()
        print(data)
    

    
    return True ,data