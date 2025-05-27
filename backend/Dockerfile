FROM python:3.9-slim

ENV LANG=C.UTF-8
ENV PIP_DEFAULT_TIMEOUT=1000

WORKDIR /app

# 1) Copy and sanitize requirements.txt
COPY requirements.txt .
RUN sed -i \
      -e 's/←//g' \
      -e 's/ --hash=[^ ]*//g' \
      requirements.txt

# 2) Install Python dependencies
RUN pip install --no-cache-dir --timeout 100 flask-cors \
 && pip install --no-cache-dir --timeout 100 -r requirements.txt

# 3) Install Java 17 and essential tools
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      openjdk-17-jre-headless \
      bash unzip curl \
 && rm -rf /var/lib/apt/lists/*

# 4) Auto-detect JAVA_HOME and export it
RUN JAVA_HOME=$(readlink -f /usr/bin/java | sed "s:/bin/java::") \
 && echo "Detected JAVA_HOME=$JAVA_HOME" \
 && echo "export JAVA_HOME=$JAVA_HOME" >> /etc/profile.d/java.sh \
 && echo 'export PATH="$JAVA_HOME/bin:$PATH"' >> /etc/profile.d/java.sh



# 5) Copy application code
COPY . .

EXPOSE 5000
CMD ["bash", "-lc", "python app.py"]
