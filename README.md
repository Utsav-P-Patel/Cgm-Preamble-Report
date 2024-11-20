# Project Documentation

## Overview

This project is designed to visualize glucose and meal data, generate reports, and manage user authentication. It uses Flask for the backend, D3.js for data visualization, and jsPDF for generating PDF reports. The project is deployed using Gunicorn and managed with Supervisord.

## Project Structure

### Root Directory

- **gunicorn.conf.py**: Configuration file for Gunicorn, specifying server settings and logging.
- **nginxConfig**: Configuration for Nginx to forward requests from port 80 to port 8000.
- **patientApiWithAuth.py**: Main file with all APIs and business logic, including authentication.
- **requirements.txt**: Lists all the project dependencies.
- **run.sh**: Script with commands for deploying the project.
- **supervisord.conf**: Configuration for Supervisord, managing the application processes.

### Directories

- **auth/**: Contains authentication-related JSON files.
  - **CGM_O_Auth.json**
  - **clientsecret.json**
- **static/**: Contains static assets like CSS, JavaScript, and images.
  - **assets/**: Subdirectory for assets.
    - **js/**: JavaScript files for various functionalities.
      - **chartGenerate.js**: Generates visualization charts.
      - **contentLoader.js**: Handles data preprocessing, API calls, and UI updates.
      - **pdfGenerateAsync.js**: Asynchronous script for generating PDFs.
      - **request.js**: Handles API requests and data cleaning.
    - **css/**: CSS files for styling.
      - **style.css**: Main stylesheet.
      - **d3.css**: Additional styles for D3.js charts.
- **templates/**: HTML templates for the web application.
  - **index.html**: Home page template.
  - **login.html**: Login page template.
- **tmp/**: Temporary directory for storing files.
  - **pdf/**: Subdirectory for PDF files.

## Key Files and Their Functions

### Python Files

- **patientApiWithAuth.py**: Main application file with routes for user authentication, data retrieval, and PDF management.

### JavaScript Files

- **chartGenerate.js**: Generates charts using D3.js.
- **contentLoader.js**: Loads and processes content, manages UI interactions.
- **pdfGenerateAsync.js**: Asynchronous PDF generation script.
- **request.js**: Handles API requests and data cleaning.

### Configuration Files

- **gunicorn.conf.py**: Configures Gunicorn server settings.
- **nginxConfig**: Nginx configuration for reverse proxy.
- **supervisord.conf**: Configures Supervisord for process management.
- **requirements.txt**: Lists Python dependencies.

### Deployment Script

- **run.sh**: Script for setting up and deploying the project.

## Functionality

### Backend (Flask)

- **patientApiWithAuth.py**: Handles user authentication using Google-based login, retrieves data from Tryvital, saves patient reports, and manages other business logic.

### Frontend (HTML and JavaScript)

- **index.html**: Home page where users can interact with the application.
- **login.html**: Google-based login page.
- **chartGenerate.js**: Generates visualization charts using D3.js.
- **contentLoader.js**: Manages data preprocessing, API calls, and UI updates based on different conditions.
- **pdfGenerateAsync.js**: Asynchronously generates PDF reports from the loaded content.
- **request.js**: Fetches data from the API, cleans, and filters it.

### Server Configuration

- **Nginx**: Acts as a reverse proxy to forward requests from port 80 to port 8000, where Gunicorn is running.
- **Gunicorn**: Serves the Flask application as a WSGI HTTP server.
- **Supervisord**: Manages and ensures that the Gunicorn process runs continuously and restarts if it fails.

## Deployment Instructions

1. **Start Nginx**: Configure and restart Nginx using the settings in `nginxConfig`.
   ```sh
   sudo systemctl restart nginx
   ```

2. **Activate Virtual Environment**: Activate the Python virtual environment.
   ```sh
   source env/bin/activate
   ```

3. **Install Dependencies**: Install the required Python packages.
   ```sh
   pip install -r requirements.txt
   ```

4. **Run Supervisord**: Start the application using Supervisord.
   ```sh
   supervisord -c supervisord.conf
   ```

5. **Check Application Status**: Verify the application status.
   ```sh
   supervisorctl -c supervisord.conf status
   ```

## Configuration Files

### gunicorn.conf.py

Configures the Gunicorn server settings, including error logging and logging location.

### nginxConfig

Configures Nginx to forward requests from port 80 to port 8000 (Gunicorn server port).

### supervisord.conf

Configures Supervisord for process management, including logging info, location, server URL, autostart, and autorestart settings.

By following these steps and using the provided configuration files, you can successfully deploy and manage the project.