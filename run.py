from app import create_app
from flask_minify import minify

app = create_app()

minify(app=app, html=True, js=True, cssless=True, fail_safe=True)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)





    