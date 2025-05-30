FROM python:3.9-slim
WORKDIR /app

# Copy & install
COPY requirements.txt .
RUN sed -i -e 's/←//g' -e 's/ --hash=[^ ]*//g' requirements.txt
RUN pip install --no-cache-dir --timeout 100 flask-cors \
 && pip install --no-cache-dir --timeout 100 -r requirements.txt

# Java, etc...
RUN apt-get update \
 && apt-get install -y --no-install-recommends openjdk-17-jre-headless bash unzip curl \
 && rm -rf /var/lib/apt/lists/*

RUN JAVA_HOME=$(readlink -f /usr/bin/java | sed "s:/bin/java::") \
 && echo "export JAVA_HOME=$JAVA_HOME" > /etc/profile.d/java.sh \
 && echo 'export PATH="$JAVA_HOME/bin:$PATH"' >> /etc/profile.d/java.sh

# Copy your Python app
COPY . .
EXPOSE 5000
CMD ["python", "app.py"]
