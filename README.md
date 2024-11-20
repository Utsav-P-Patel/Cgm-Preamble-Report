<p align="center"><h1 align="center">CGM-PREAMBLE-REPORT</h1></p>
<p align="center">
	<em><code>❯ A project to visualize glucose and meal data, generate reports, and manage user authentication.</code></em>
</p>
<p align="center">
	<img src="https://img.shields.io/github/last-commit/Utsav-P-Patel/Cgm-Preamble-Report?style=default&logo=git&logoColor=white&color=0080ff" alt="last-commit">
	<img src="https://img.shields.io/github/languages/top/Utsav-P-Patel/Cgm-Preamble-Report?style=default&color=0080ff" alt="repo-top-language">
	<img src="https://img.shields.io/github/languages/count/Utsav-P-Patel/Cgm-Preamble-Report?style=default&color=0080ff" alt="repo-language-count">
</p>
<p align="center"><!-- default option, no dependency badges. -->
</p>
<p align="center">
	<!-- default option, no dependency badges. -->
</p>
<br>

## 🔗 Table of Contents

- [📍 Overview](#-overview)
- [👾 Features](#-features)
- [📁 Project Structure](#-project-structure)
  - [📂 Project Index](#-project-index)
- [🚀 Getting Started](#-getting-started)
  - [☑️ Prerequisites](#-prerequisites)
  - [⚙️ Installation](#-installation)
  - [🤖 Usage](#🤖-usage)

---

## 📍 Overview

This project is designed to visualize patient's glucose and meal data, generate reports, and manage user authentication. It uses Flask for the backend, D3.js for data visualization, and jsPDF for generating PDF reports. The project is deployed using Gunicorn and managed with Supervisord.

---

## 👾 Features

- **Data Visualization**: Visualize glucose and meal data using D3.js.
- **Report Generation**: Generate PDF reports using jsPDF.
- **User Authentication**: Manage user authentication using Google-based login.

---

## 📁 Project Structure

```sh
└── Cgm-Preamble-Report/
    ├── README.md
    ├── gunicorn.conf.py
    ├── nginxConfig
    ├── patientApiWithAuth.py
    ├── requirements.txt
    ├── run.sh
    ├── static
    │   └── assets
    │       ├── js
    │       │   ├── chartGenerate.js
    │       │   ├── contentLoader.js
    │       │   ├── pdfGenerateAsync.js
    │       │   └── request.js
    ├── supervisord.conf
    └── templates
        ├── index.html
        └── login.html
    └── auth
        └── clientsecret.json
    └── tmp
        └── pdf
```

### Project Index

<details open>
	<summary><b><code>CGM-PREAMBLE-REPORT/</code></b></summary>
	<details> <!-- __root__ Submodule -->
		<summary><b>__root__</b></summary>
		<blockquote>
			<table>
			<tr>
				<td><b><a href='https://github.com/Utsav-P-Patel/Cgm-Preamble-Report/blob/master/supervisord.conf'>supervisord.conf</a></b></td>
				<td><code>Configuration for Supervisord, managing the application processes.</code></td>
			</tr>
			<tr>
				<td><b><a href='https://github.com/Utsav-P-Patel/Cgm-Preamble-Report/blob/master/gunicorn.conf.py'>gunicorn.conf.py</a></b></td>
				<td><code>Configuration file for Gunicorn, specifying server settings and logging.</code></td>
			</tr>
			<tr>
				<td><b><a href='https://github.com/Utsav-P-Patel/Cgm-Preamble-Report/blob/master/patientApiWithAuth.py'>patientApiWithAuth.py</a></b></td>
				<td><code>Main file with all APIs and business logic, including authentication.</code></td>
			</tr>
			<tr>
				<td><b><a href='https://github.com/Utsav-P-Patel/Cgm-Preamble-Report/blob/master/requirements.txt'>requirements.txt</a></b></td>
				<td><code>Lists all the project dependencies.</code></td>
			</tr>
			<tr>
				<td><b><a href='https://github.com/Utsav-P-Patel/Cgm-Preamble-Report/blob/master/nginxConfig'>nginxConfig</a></b></td>
				<td><code>Configuration for Nginx to forward requests from port 80 to port 8000.</code></td>
			</tr>
			<tr>
				<td><b><a href='https://github.com/Utsav-P-Patel/Cgm-Preamble-Report/blob/master/run.sh'>run.sh</a></b></td>
				<td><code>Script with commands for deploying the project.</code></td>
			</tr>
			</table>
		</blockquote>
	</details>
	<details> <!-- templates Submodule -->
		<summary><b>templates</b></summary>
		<blockquote>
			<table>
			<tr>
				<td><b><a href='https://github.com/Utsav-P-Patel/Cgm-Preamble-Report/blob/master/templates/login.html'>login.html</a></b></td>
				<td><code>Login page template.</code></td>
			</tr>
			<tr>
				<td><b><a href='https://github.com/Utsav-P-Patel/Cgm-Preamble-Report/blob/master/templates/index.html'>index.html</a></b></td>
				<td><code>Home page template.</code></td>
			</tr>
			</table>
		</blockquote>
	</details>
	<details> <!-- auth Submodule -->
		<summary><b>auth</b></summary>
		<blockquote>
			<table>
			<tr>
				<td><b><a href='https://github.com/Utsav-P-Patel/Cgm-Preamble-Report/blob/master/auth/clientsecret.json'>clientsecret.json</a></b></td>
				<td><code>Contains authentication-related client secrets from google GCP OAuth.</code></td>
			</tr>
			</table>
		</blockquote>
	</details>
	<details> <!-- static Submodule -->
		<summary><b>static</b></summary>
		<blockquote>
			<table>
			<tr>
				<td><b><a href='https://github.com/Utsav-P-Patel/Cgm-Preamble-Report/blob/master/static/assets/js/chartGenerate.js'>chartGenerate.js</a></b></td>
				<td><code>Generates visualization charts using D3.js.</code></td>
			</tr>
			<tr>
				<td><b><a href='https://github.com/Utsav-P-Patel/Cgm-Preamble-Report/blob/master/static/assets/js/contentLoader.js'>contentLoader.js</a></b></td>
				<td><code>Handles data preprocessing, API calls, and UI updates.</code></td>
			</tr>
			<tr>
				<td><b><a href='https://github.com/Utsav-P-Patel/Cgm-Preamble-Report/blob/master/static/assets/js/pdfGenerateAsync.js'>pdfGenerateAsync.js</a></b></td>
				<td><code>Asynchronous script for generating PDFs.</code></td>
			</tr>
			<tr>
				<td><b><a href='https://github.com/Utsav-P-Patel/Cgm-Preamble-Report/blob/master/static/assets/js/request.js'>request.js</a></b></td>
				<td><code>Handles API requests and data cleaning.</code></td>
			</tr>
			</table>
		</blockquote>
	</details>
	<details> <!-- tmp Submodule -->
		<summary><b>tmp</b></summary>
		<blockquote>
			<table>
			<tr>
				<td><b><a href='https://github.com/Utsav-P-Patel/Cgm-Preamble-Report/tree/master/tmp/pdf'>pdf</a></b></td>
				<td><code>Subdirectory for storing generated PDF files.</code></td>
			</tr>
			</table>
		</blockquote>
	</details>
</details>

---

## 🚀 Getting Started

### ☑️ Prerequisites

Before getting started with Cgm-Preamble-Report, ensure your runtime environment meets the following requirements:

- **Programming Language:** Python
- **Package Manager:** Pip
- **Web Server:** Nginx
- **Process Manager:** Supervisord

### ⚙️ Installation

Install Cgm-Preamble-Report using the following steps:

1. **Clone the Repository:**

```sh
❯ git clone https://github.com/Utsav-P-Patel/Cgm-Preamble-Report
```

2. **Navigate to the Project Directory:**

```sh
❯ cd Cgm-Preamble-Report
```

3. **Create and Activate a Virtual Environment:**

```sh
❯ python3 -m venv env
❯ source env/bin/activate
```

4. **Install the Project Dependencies:**

```sh
❯ pip install -r requirements.txt
```

5. **Configure Nginx:**

   - Place the `nginxConfig` file in the appropriate Nginx configuration directory (e.g., `/etc/nginx/sites-available/`).
   - Create a symlink to the `sites-enabled` directory:

   ```sh
   sudo ln -s /etc/nginx/sites-available/nginxConfig /etc/nginx/sites-enabled/
   ```

   - Restart Nginx:

   ```sh
   sudo systemctl restart nginx
   ```
6. **Start the Application using Supervisord and Check Application Status:**

   - Start the application using Supervisord:

   ```sh
   sudo supervisord -c supervisord.conf
   ```

   - Check the application status:

   ```sh
   sudo supervisorctl -c supervisord.conf status
   ```

### 🤖 Usage

Run Cgm-Preamble-Report using the following command:

```sh
❯ supervisord -c supervisord.conf
```

---
