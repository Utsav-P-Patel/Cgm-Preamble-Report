# app.py
from flask import Flask, jsonify, request, abort, send_file, Response, after_this_request, render_template, redirect, url_for, make_response
import mysql.connector
import os
import tempfile
import boto3
from dotenv import load_dotenv
import requests
from flask_cors import CORS
import json
import pytz
from datetime import datetime, timedelta
from dateutil.parser import parse
import pathlib
from google_auth_oauthlib.flow import Flow
from google.oauth2 import id_token
from google.auth.transport import requests as googleRequests
from google.auth.exceptions import GoogleAuthError
from functools import wraps

load_dotenv()

DB_HOST = os.getenv("DB_HOST")
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_DATABASE = os.getenv("DB_DATABASE")

S3_BUCKET = os.getenv("S3_BUCKET")
S3_ACCESS_KEY = os.getenv("S3_ACCESS_KEY")
S3_SECRET_KEY = os.getenv("S3_SECRET_KEY")
S3_REGION = os.getenv("S3_REGION")


BASE_URL = os.getenv("BASE_URL")
API_KEY=os.getenv("API_KEY")

S3 = boto3.client(
    's3',
    aws_access_key_id=S3_ACCESS_KEY,
    aws_secret_access_key=S3_SECRET_KEY
    #             region_name=S3_REGION
)

app = Flask(__name__)
app.secret_key = 'cgm'

CORS(app)


os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_DISCOVERY_URL = os.getenv("GOOGLE_DISCOVERY_URL")

CLIENT_SECRETS_FILE = os.path.join(pathlib.Path(__file__).parent, "auth/clientsecret.json")
# CLIENT_SECRETS_FILE = os.path.join(pathlib.Path(__file__).parent, "auth/CGM_O_Auth.json")

flow = Flow.from_client_secrets_file(
    CLIENT_SECRETS_FILE,
    scopes=["openid", "https://www.googleapis.com/auth/userinfo.profile",
            "https://www.googleapis.com/auth/userinfo.email"],
    redirect_uri="http://127.0.0.1:5000/callback"
#     redirect_uri="http://localhost:5000/callback"
)

#FIXME:  on logout delete back history or something so that page is not visible
#  Try catch in all functions.


def get_db_connection():
    conn = mysql.connector.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASS,
        database=DB_DATABASE
    )
    return conn


def authenticated(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # FIXME: Remove return when auth required.
        return f(*args, **kwargs)
        token = request.cookies.get('token')
        if not token:
            return redirect(url_for('login'))
        try:
            request_session = googleRequests.Request()
            id_token.verify_oauth2_token(
                token,
                request_session,
                GOOGLE_CLIENT_ID,
                clock_skew_in_seconds=5
            )
        except GoogleAuthError:
            return redirect(url_for('login'))
        except ValueError:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function


def addUserToDB(userinfo_response):
    userinfo_response = userinfo_response.json()

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT 1 FROM users WHERE email = %s", (userinfo_response['email'],))
    if cursor.fetchone() is None:
        cursor.execute("""
            INSERT INTO users (first_name, last_name, email)
            VALUES (%s, %s, %s)
        """, (userinfo_response['given_name'], userinfo_response['family_name'], userinfo_response['email']))
        conn.commit()

    cursor.close()
    conn.close()
    return


@app.route("/callback")
def callback():
    token = flow.fetch_token(authorization_response=request.url)
    credentials = flow.credentials

    userinfo_endpoint = "https://www.googleapis.com/oauth2/v3/userinfo"
    userinfo_response = requests.get(
        userinfo_endpoint,
        headers={"Authorization": f"Bearer {credentials.token}"}
    )

    addUserToDB(userinfo_response)

    request_session = googleRequests.Request()
    id_info = id_token.verify_oauth2_token(
        credentials._id_token,
        request_session,
        GOOGLE_CLIENT_ID,
        clock_skew_in_seconds=5
    )
    response = make_response(redirect(url_for('index')))
    response.set_cookie('token', credentials._id_token)
    response.set_cookie('name', userinfo_response.json()['name'])
    response.set_cookie('email', userinfo_response.json()['email'])
    response.set_cookie('picture', userinfo_response.json()['picture'])
    return response


@app.route("/logout")
def logout():
    response = make_response(redirect(url_for('login')))
    response.set_cookie('token', '', expires=0)
    response.set_cookie('name', '', expires=0)
    response.set_cookie('picture', '', expires=0)

    # Add headers to prevent caching
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response


@app.route('/')
@authenticated
def index():
    name = request.cookies.get('name')
    picture = request.cookies.get('picture')
    return render_template('index.html', name = name, picture = picture)


@app.route('/login')
def login():
    return render_template('login.html')


@app.route("/google_login")
def google_login():
    authorization_url, state = flow.authorization_url(prompt='consent')
    return redirect(authorization_url)


@app.route('/users', methods=['GET'])
@authenticated
def get_users():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT ps.first_name, ps.last_name, ps.email, rs.resource_id from patients ps join resources rs on rs.patient_id = ps.id WHERE rs.resource_name  = 'vital_39965a49-6c44-48a3-959b-db49d03ac469';")
    # cursor.execute("SELECT ps.first_name, ps.last_name, ps.email, rs.resource_id from prod_preamble.patients ps join prod_preamble.resources rs on rs.patient_id = ps.id WHERE rs.resource_name  = 'vital_39965a49-6c44-48a3-959b-db49d03ac469';")
    users = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(users)


@app.route('/user_details', methods=['GET'])
@authenticated
def det_user_details():
    resource_id = request.args.get('resource_id')
    if not resource_id:
        return jsonify({"error": "resource_id is required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    # query = """
    #     SELECT ps.first_name, ps.last_name, ps.email, ps.id, rs.resource_id
    #     FROM prod_preamble.patients as ps
    #     JOIN prod_preamble.resources as rs
    #     ON rs.patient_id = ps.id
    #     WHERE rs.resource_id = %s;
    # """
    query = """
        SELECT ps.first_name, ps.last_name, ps.email, ps.id, rs.resource_id
        FROM patients as ps
        JOIN resources as rs
        ON rs.patient_id = ps.id
        WHERE rs.resource_id = %s;
    """
    cursor.execute(query, (resource_id,))
    current_user = cursor.fetchall()
    cursor.close()
    conn.close()

#     TODO: Get data as needed from database.
#     Will be used for saving s3 bucket.
#     print(current_user)

    return jsonify(current_user)


def addReportDetailsToDB(filename, patient_id, user_email):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Execute the SQL query
        cursor.execute("""
            INSERT INTO reports (patient_id, s3_arn, downloaded_by)
            SELECT r.patient_id , %s, u.id
            FROM users u 
            left join resources r 
            on r.resource_id = %s
            WHERE u.email = %s
        """, (filename, patient_id, user_email))

        conn.commit()

    except mysql.connector.Error as err:
        print(f"Error: {err}")

    finally:
        cursor.close()
        conn.close()


# FIXME: @authenticated think afterwards.
@app.route('/upload-pdf', methods=['POST'])
def upload_pdf():
    if 'pdf' not in request.files:
        return jsonify({'error': 'No PDF file provided'}), 400

    pdf_file = request.files['pdf']
    patient_id = request.form.get('userId')
    user_email = request.form.get('email')

    if pdf_file.filename == '':
        return jsonify({'error': 'No selected PDF file'}), 400

    if not patient_id:
        return jsonify({'error': 'Patient ID is required'}), 400

    try:
        temp_dir = "tmp/pdf"
        os.makedirs(temp_dir, exist_ok=True)
        temp_file_path = os.path.join(temp_dir, pdf_file.filename)

        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

        pdf_file.save(temp_file_path)
        S3.upload_file(temp_file_path, S3_BUCKET, pdf_file.filename)

        addReportDetailsToDB(pdf_file.filename, patient_id, user_email)

        os.remove(temp_file_path)

        return jsonify({'message': 'PDF uploaded successfully to S3'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# FIXME: @authenticated think afterwards.
@app.route('/get-pdf-list', methods=['GET'])
def list_pdf():
    try:
        objects = S3.list_objects_v2(Bucket=S3_BUCKET)
        object_list = [obj['Key'] for obj in objects.get('Contents', [])]
        return jsonify(object_list)

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# FIXME: @authenticated think afterwards.
@app.route('/s3-file', methods=['GET'])
def get_s3_file():
    filename = request.args.get('filename')
    if not filename:
        abort(400, description="Filename is required")

    try:
        local_download_path = 'tmp/pdf'
        local_file_path = os.path.join(local_download_path, filename)

        S3.download_file(S3_BUCKET, filename, local_file_path)
        response_file = send_file(local_file_path)
        # os.remove(local_file_path)
        # Send file to client
        @after_this_request
        def delete_file(response):
            os.remove(local_file_path)
            return response

        return response_file
    except Exception as e:
        abort(404, description=f"File not found: {str(e)}")


def get_user_timezone(user_id):
    url = f"{BASE_URL}/v2/user/{user_id}"
    headers = {
        'x-vital-api-key': API_KEY,
        'Accept': 'application/json'
    }
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        data = response.json()
        timezone = data['fallback_time_zone']
        if timezone is None:
            timezone = {'id': 'America/Phoenix'}
            # return {
            #     'error': 'No fallback time zone found.',
            #     'status_code': response.status_code,
            #     'response_text': response.text
            # }
        return timezone
    else:
        return {
            'error': 'There was a problem with the request',
            'status_code': response.status_code,
            'response_text': response.text
        }


def convert_timestamp_to_timezone(timestamp, request_timezone, data_timezone):
    utc_date = datetime.strptime(timestamp, "%Y-%m-%dT%H:%M:%S%z").replace(tzinfo=pytz.UTC)

    request_offset = datetime.now(pytz.timezone(request_timezone)).utcoffset().total_seconds() // 60
    data_offset = datetime.now(pytz.timezone(data_timezone)).utcoffset().total_seconds() // 60

    offset_difference = data_offset - request_offset

    converted_date = utc_date + timedelta(minutes=offset_difference)

    return converted_date.strftime("%Y-%m-%dT%H:%M:%S%z")


def convert_timestamps_to_timezone(data, request_timezone, data_timezone):
    converted_data = []
    data_tz = pytz.timezone(data_timezone)
    request_tz = pytz.timezone(request_timezone)
    for entry in data:
        converted_timestamp = convert_timestamp_to_timezone(entry["timestamp"], request_timezone, data_timezone)

        entry["timestamp"] = converted_timestamp
        converted_data.append(entry)

    return converted_data


@app.route('/glucosedata', methods=['GET'])
@authenticated
def get_glucose_data():
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    user_resource_id = request.args.get('resource_id')
    request_timezone = request.args.get('request_timezone')

    response = get_user_timezone(user_resource_id)
    if 'error' not in response:
        usr_timezone = response['id']
        # print(usr_timezone)
    else:
        print(response)
        print("error")
        return jsonify({
            'error': 'There was a problem with the request',
            'status_code': 400,
            'response_text': "Error getting user timezone"
        }), 400

    url = f"{BASE_URL}/v2/timeseries/{user_resource_id}/glucose?&start_date={start_date}&end_date={end_date}"

    headers = {
        'x-vital-api-key': API_KEY
    }

    response = requests.get(url, headers=headers)


    # request_timezone = "Asia/Calcutta"
    data_timezone = "Europe/London"

    converted_data = convert_timestamps_to_timezone(response.json(), request_timezone, usr_timezone)
    filtered_data = [item for item in converted_data if item.get('type') == 'automatic']
    if response.status_code == 200:
        return jsonify(filtered_data)
#         return jsonify({
#             'original': response.json(),
#             'altered': converted_data
#         })
    else:
        return jsonify({
            'error': 'There was a problem with the request',
            'status_code': response.status_code,
            'response_text': response.text
        }), response.status_code


def convert_timestamps_to_timezone1(data, request_timezone, data_timezone):
    converted_data = []
    converted_data1 = {}
    data_tz = pytz.timezone(data_timezone)
    request_tz = pytz.timezone(request_timezone)

    for entry in data['meals']:
        converted_timestamp = convert_timestamp_to_timezone(entry["created_at"], request_timezone, data_timezone)

        entry["created_at"] = converted_timestamp
        converted_data.append(entry)
    converted_data1['meals'] = converted_data
    return converted_data1


@app.route('/mealdata', methods=['GET'])
@authenticated
def get_meal_data():
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    user_resource_id = request.args.get('resource_id')
    request_timezone = request.args.get('request_timezone')

    response = get_user_timezone(user_resource_id)
    if 'error' not in response:
        usr_timezone = response['id']
        # print(usr_timezone)
    else:
        print("error")
        return jsonify({
            'error': 'There was a problem with the request',
            'status_code': 400,
            'response_text': "Error getting user timezone"
        }), 400
#     start_date = "2024/05/18"
#     end_date = "2024/05/20"
    url = f"{BASE_URL}/v2/summary/meal/{user_resource_id}?&start_date={start_date}&end_date={end_date}"

    headers = {
        'x-vital-api-key': API_KEY
    }

    response = requests.get(url, headers=headers)

    converted_data = convert_timestamps_to_timezone1(response.json(), request_timezone, usr_timezone)

    if response.status_code == 200:
        sorted_data = sorted(converted_data['meals'], key=lambda x: parse(x['created_at']))
        converted_data['meals'] = sorted_data
        return jsonify(converted_data)
#         return jsonify({
#                     'original': response.json(),
#                     'altered': converted_data
#                 })
#         return jsonify(response.json())
    else:
        return jsonify({
            'error': 'There was a problem with the request',
            'status_code': response.status_code,
            'response_text': response.text
        }), response.status_code


# TODO: Can create a custom url which will have file instance from s3.
#   URl will be temporary and expire after some time.
#   Like when we download folder from Google drive, the link is temperary.

if __name__ == '__main__':
    app.run(port=5000, debug=True)
#     app.run(host='0.0.0.0', port=5000)
