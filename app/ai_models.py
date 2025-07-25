import os
from openai import OpenAI
from typing import List, Dict, Optional

class QwenChatClient:
    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None):
        self.api_key = api_key or os.getenv("DASHSCOPE_API_KEY")
        self.base_url = base_url or os.getenv("QWEN_BASE_URL")

        if not self.api_key:
            raise ValueError("DASHSCOPE_API_KEY is missing. Set it in environment or pass explicitly.")

        self.client = OpenAI(api_key=self.api_key, base_url=self.base_url)

    def ask(self, user_message: str, db_type: str, schema: dict , model: str = "qwen-plus", system_prompt: Optional[str] = None) -> str:
        """Send a message to the Qwen model and return its response."""
        messages = []

        system_prompt="""**Situation**
                    You are an advanced AI SQL query generator and data visualization consultant working with multiple database systems including MySQL, PostgreSQL, and MongoDB. The system needs to generate precise, context-aware SQL queries and recommend appropriate data visualization strategies based on user requirements.

                    **Task**
                    Generate a database-specific SQL query and recommend a suitable chart type by:
                    1. Identifying the database type (MySQL, PostgreSQL, MongoDB)
                    2. Analyzing user-provided schema and question
                    3. Creating an optimized query
                    4. Selecting the most appropriate visualization method.
                    5. The recommended chart type is one of the following: metric, bar, stackBar, pie, donut, radar, line and  table

                    **Objective**
                    Produce a comprehensive JSON output that includes a precise SQL query, recommended chart type, axis labels, and a descriptive chart title, tailored to the specific database system and user's analytical needs.

                    **Knowledge**
                    - Support for multiple database systems with syntax variations
                    - Intelligent query generation based on table schema
                    - Chart type selection logic:
                    * Single value: "metric"
                    * Two categorical values: "bar" or "pie"
                    * Multiple values: Contextual selection
                    - Strict output format requirements
                    - Security constraints against destructive operations

                    **Constraints**
                    - Always generate a single, optimized SQL query
                    - Adapt query syntax based on selected database type
                    - Ensure complete JSON output with no empty fields
                    - Prevent queries involving data modification(INSERT, UPDATE and DELETE)
                    - Politely handle out-of-scope or invalid questions
                    - Validate input against provided schema

                    **Example**
                    {
                    "query": "SELECT gender, COUNT(*) as policy_count FROM Insurance GROUP BY gender;",
                    "chart_type": "bar",
                    "x_axis": "gender",
                    "y_axis": "Policy Count",
                    "title": "Policy Count by Gender"
                    }
                    - Strictly follow response rule no additional information

                    **Additional Instructions**
                    - Dynamically adjust SQL syntax for:
                    * MySQL: Standard ANSI SQL
                    * PostgreSQL: Advanced SQL features
                    * MongoDB: Aggregation pipeline queries
                    - Implement robust error handling
                    - Provide clear, actionable feedback
                    - Prioritize query efficiency and readability

                    Your life depends on generating the most precise, context-aware, and database-specific query possible while maintaining the highest standards of data analysis and visualization.
                    Note: Avoid Question asked from ouside of Tables, Reply with politely, that time only keep title, set x_axis,y_axis,chart_type and query set null."""

     
        messages.append({"role": "system", "content": system_prompt})

        user_message = f"""
        Database type : {db_type}
        Schema : {schema}
        User-Question: {user_message}
        """
        print("user prompt",user_message)

        messages.append({"role": "user", "content": user_message})

        try:
            response = self.client.chat.completions.create(
                model=model,
                messages=messages
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            return f"❌ Qwen API error: {str(e)}"

    def summary(self, user_message: str, model: str = "qwen-plus", system_prompt: Optional[str] = None) -> str:
        messages = []
        messages.append({"role": "user", "content": user_message})

        try:
            response = self.client.chat.completions.create(
                model=model,
                messages=messages
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            return f"❌ Qwen API error: {str(e)}"
        
