import pandas as pd

class ChartDataProcessor:
    def __init__(self, json_data, result):
        self.json_data = json_data
        self.result = result
        self.data = {}

    def process(self):
        chart_type = self.json_data.get("chart_type")
        method_name = f"process_{chart_type}"
        
        if hasattr(self, method_name):
            getattr(self, method_name)()
        else:
            raise ValueError(f"Unsupported chart type: {chart_type}")
        
        return True, self.data

    

    def process_pie(self):
        columns = self.result.columns
        self.data["message"] = self.json_data.get("title")
        self.data["chart_type"] = "pie"
        self.data["chart_data"] = {
            "title": self.json_data.get("title"),
            "labels": self.result[columns[0]].tolist(),
            "values": self.result[columns[1]].tolist()
        }

    def process_funnel(self):
        columns = self.result.columns
        pre_data = {
            'title': 'Funnel Chart',
            'datasets': self.result.apply(lambda row: {'label': row[columns[0]], 'values': [row[columns[1]]]}, axis=1).tolist()
        }

        self.data["message"] = self.json_data.get("title")
        self.data["chart_type"] = "funnel"
        self.data["chart_data"] = pre_data
        self.data["chart_data"]["title"] = self.json_data.get("title")
        self.data["chart_data"]["x_axis"] = self.json_data.get("x_axis")
        self.data["chart_data"]["y_axis"] = self.json_data.get("y_axis")

    def process_bar(self):
        columns = self.result.columns
        self.data["message"] = self.json_data.get("title")
        self.data["chart_type"] = "bar"

        if len(columns) == 2:
            self.data["chart_data"] = {
                "title": self.json_data.get("title"),
                "labels": self.result[columns[0]].tolist(),
                "values": self.result[columns[1]].tolist(),
                "x_axis": self.json_data.get("x_axis"),
                "y_axis": self.json_data.get("y_axis")
            }
        elif len(columns) == 3:
            col1_str = pd.api.types.is_string_dtype(self.result.iloc[:, 0])
            col2_str = pd.api.types.is_string_dtype(self.result.iloc[:, 1])
            col3_num = pd.api.types.is_numeric_dtype(self.result.iloc[:, 2])

            #if col1_str and col2_str and col3_num:
            pivot_df = self.result.pivot_table(
                index=self.result.columns[0], 
                columns=self.result.columns[1], 
                values=self.result.columns[2],
                aggfunc='sum',
                fill_value=0
            )

            unique_products = pivot_df.columns.tolist()
            sales_dict = {}
            for product in unique_products:
                sales_dict[product] = pivot_df[product].tolist()

            self.data["chart_type"] = "barWithLine"
            self.data["chart_data"] = {
                "title": self.json_data.get("title"),
                "labels": pivot_df.index.tolist(),
                "values": pivot_df.iloc[:, 0].tolist(),
                "lineValues": pivot_df.iloc[:, 1].tolist() if len(pivot_df.columns) > 1 else []
            }
            # else:
            #     self.data["chart_type"] = "barWithLine"
            #     self.data["chart_data"] = {
            #         "title": self.json_data.get("title"),
            #         "labels": self.result[columns[0]].tolist(),
            #         "values": self.result[columns[1]].tolist(),
            #         "lineValues": self.result[columns[2]].tolist(),
            #         "bar_name": columns[1],
            #         "line_name": columns[2]
            #     }
        else:
            self.data["chart_type"] = "barWithMultipleLine"
            self.data["chart_data"] = {
                "title": self.json_data.get("title"),
                "bar_name": columns[1],
                "labels": self.result[columns[0]].tolist(),
                "values": self.result[columns[1]].tolist(),
                "line_datasets": [{"label": column, "values": self.result[column].tolist()} for column in columns[2:]]
            }

    def process_stackBar(self):
        columns = self.result.columns
        self.data["message"] = self.json_data.get("title")
        self.data["chart_type"] = "stackBar"

        if len(columns) == 3:
            col1_str = pd.api.types.is_string_dtype(self.result.iloc[:, 0])
            col2_str = pd.api.types.is_string_dtype(self.result.iloc[:, 1])
            col3_num = pd.api.types.is_numeric_dtype(self.result.iloc[:, 2])

            #if col1_str and col2_str and col3_num:
            pivot_df = self.result.pivot_table(
                index=self.result.columns[0], 
                columns=self.result.columns[1], 
                values=self.result.columns[2],
                aggfunc='sum',
                fill_value=0
            ).reset_index()

            self.data["chart_data"] = {
                "title": self.json_data.get("title"),
                "labels": pivot_df[columns[0]].tolist(),
                "datasets": [{"label": product, "values": pivot_df[product].tolist()} for product in pivot_df.columns[1:]]
            }
            # else:
            #     self.data["chart_data"] = {
            #         "title": self.json_data.get("title"),
            #         "labels": self.result[columns[0]].tolist(),
            #         "datasets": [{"label": column, "values": self.result[column].tolist()} for column in columns[1:]]
            #     }
        else:
            self.data["chart_data"] = {
                "title": self.json_data.get("title"),
                "labels": self.result[columns[0]].tolist(),
                "datasets": [{"label": column, "values": self.result[column].tolist()} for column in columns[1:]]
            }

    def process_barWithMultipleLine(self):
        columns = self.result.columns
        self.data["message"] = self.json_data.get("title")
        self.data["chart_type"] = "barWithMultipleLine"
        self.data["chart_data"] = {
            "title": self.json_data.get("title"),
            "labels": self.result[columns[0]].tolist(),
            "values": self.result[columns[1]].tolist(),
            "line_datasets": [{"label": column, "values": self.result[column].tolist()} for column in columns[2:]]
        }

    def process_wordCloud(self):
        columns = self.result.columns
        self.data["message"] = self.json_data.get("title")
        self.data["chart_type"] = "wordCloud"
        self.data["chart_data"] = {
            "title": self.json_data.get("title"),
            "words": [{"text": label, "weight": value} for label, value in zip(self.result[columns[0]].tolist(), self.result[columns[1]].tolist())]
        }

    def process_donut(self):
        columns = self.result.columns
        self.data["message"] = self.json_data.get("title")
        self.data["chart_type"] = "donut"
        self.data["chart_data"] = {
            "title": self.json_data.get("title"),
            "labels": self.result[columns[0]].tolist(),
            "values": self.result[columns[1]].tolist()
        }

    def process_table(self):
        columns = self.result.columns
        self.data["message"] = self.json_data.get("title")
        self.data["chart_type"] = "table"
        self.data["chart_data"] = {
            "title": self.json_data.get("title"),
            "datasets": [{"label": column, "values": self.result[column].tolist()} for column in columns]
        }

    def process_radar(self):
        columns = self.result.columns
        self.data["message"] = self.json_data.get("title")
        self.data["chart_type"] = "radar"

        if len(columns) == 3:
            col1_str = pd.api.types.is_string_dtype(self.result.iloc[:, 0])
            col2_str = pd.api.types.is_string_dtype(self.result.iloc[:, 1])
            col3_num = pd.api.types.is_numeric_dtype(self.result.iloc[:, 2])

            if col1_str and col2_str and col3_num:
                pivot_df = self.result.pivot_table(
                    index=self.result.columns[0], 
                    columns=self.result.columns[1], 
                    values=self.result.columns[2],
                    aggfunc='sum',
                    fill_value=0
                ).reset_index()

                self.data["chart_data"] = {
                    "title": self.json_data.get("title"),
                    "labels": pivot_df[columns[0]].tolist(),
                    "datasets": [{"label": product, "values": pivot_df[product].tolist()} for product in pivot_df.columns[1:]]
                }
            else:
                pivot_df = self.result.pivot_table(
                    index=self.result.columns[0], 
                    columns=self.result.columns[1], 
                    values=self.result.columns[2],
                    aggfunc='sum',
                    fill_value=0
                ).reset_index()

                self.data["chart_data"] = {
                    "title": self.json_data.get("title"),
                    "labels": pivot_df[columns[0]].tolist(),
                    "datasets": [{"label": product, "values": pivot_df[product].tolist()} for product in pivot_df.columns[1:]]
                }
        else:
            self.data["chart_data"] = {
                "title": self.json_data.get("title"),
                "labels": self.result[columns[0]].tolist(),
                "datasets": [{"label": column, "values": self.result[column].tolist()} for column in columns[1:]],
                "x_axis": self.json_data.get("x_axis"),
                "y_axis": self.json_data.get("y_axis")
            }

    def process_line(self):
        columns = self.result.columns
        self.data["message"] = self.json_data.get("title")
        self.data["chart_type"] = "line"

        if len(columns) == 3:
            col1_str = pd.api.types.is_string_dtype(self.result.iloc[:, 0])
            col2_str = pd.api.types.is_string_dtype(self.result.iloc[:, 1])
            col3_num = pd.api.types.is_numeric_dtype(self.result.iloc[:, 2])

            #if col1_str and col2_str and col3_num:
            pivot_df = self.result.pivot_table(
                index=self.result.columns[0], 
                columns=self.result.columns[1], 
                values=self.result.columns[2],
                aggfunc='sum',
                fill_value=0
            ).reset_index()

            self.data["chart_data"] = {
                "title": self.json_data.get("title"),
                "labels": pivot_df[columns[0]].tolist(),
                "datasets": [{"label": product, "values": pivot_df[product].tolist()} for product in pivot_df.columns[1:]],
                "x_axis": self.json_data.get("x_axis"),
                "y_axis": self.json_data.get("y_axis")
            }
            # else:
            #     self.data["chart_data"] = {
            #         "title": self.json_data.get("title"),
            #         "labels": self.result[columns[0]].tolist(),
            #         "datasets": [{"label": column, "values": self.result[column].tolist()} for column in columns[1:]],
            #         "x_axis": self.json_data.get("x_axis"),
            #         "y_axis": self.json_data.get("y_axis")
            #     }
        else:
            self.data["chart_data"] = {
                "title": self.json_data.get("title"),
                "labels": self.result[columns[0]].tolist(),
                "datasets": [{"label": column, "values": self.result[column].tolist()} for column in columns[1:]],
                "x_axis": self.json_data.get("x_axis"),
                "y_axis": self.json_data.get("y_axis")
            }

# # Example usage
# json_data = {
#     "chart_type": "bar",
#     "title": "Example Chart"
# }

# result = pd.DataFrame({
#     "Category": ["A", "B", "C"],
#     "Value": [10, 20, 30]
# })

# processor = ChartDataProcessor(json_data, result)
# success, data = processor.process()
# print(data)