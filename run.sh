set -e

sudo apt update -y
sudo apt install python3 -y
sudo apt install python3-pip -y
pip3 --version
sudo apt-get install unzip
sudo apt-get install supervisor
sudo apt install python3-venv
python3 -m venv env
source env/bin/activate
mkdir Deploy
pip3 install -r requirements.txt
supervisord -c supervisord.conf
supervisorctl -c supervisord.conf status

# FIXME
#Upload zip
#scp -i "cgmreports.pem" /Users/utsavpatel/Developer/Work/Chart/D3_Deploy.zip ubuntu@ec2-13-48-196-128.eu-north-1.compute.amazonaws.com:/home/ubuntu/Deploy
#Also enable inbound traffic for us to be able to access from external ip.
# Add ec2 ip so that cors error goes away for sandbox api.
