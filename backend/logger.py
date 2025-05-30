import os
import json
import logging
from datetime import datetime
from logging.handlers import RotatingFileHandler
from pyspark.sql import SparkSession

class HadoopLogger:
    def __init__(self, app_name="TarimTahminAPI", hdfs_log_path="hdfs://namenode:9000/user/root/request_logs"):
        self.app_name = app_name
        self.hdfs_log_path = hdfs_log_path
        self.local_log_path = os.path.join(os.getcwd(), "logs", "requests.log")
        self.setup_logger()
        
    def setup_logger(self):
        # Create logs directory if it doesn't exist
        os.makedirs(os.path.dirname(self.local_log_path), exist_ok=True)
        
        # Setup main logger
        self.logger = logging.getLogger(self.app_name)
        self.logger.setLevel(logging.INFO)
        
        # Formatter
        formatter = logging.Formatter(
            '{"timestamp": "%(asctime)s", "level": "%(levelname)s", "message": "%(message)s"}',
            datefmt="%Y-%m-%dT%H:%M:%S"
        )
        
        # File handler (local)
        file_handler = RotatingFileHandler(
            self.local_log_path,
            maxBytes=10*1024*1024,  # 10MB
            backupCount=5
        )
        file_handler.setFormatter(formatter)
        self.logger.addHandler(file_handler)
        
        # Console handler
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(formatter)
        self.logger.addHandler(console_handler)
    
    def _get_spark_session(self):
        return SparkSession.builder \
            .appName(self.app_name) \
            .config("spark.hadoop.fs.defaultFS", "hdfs://namenode:9000") \
            .getOrCreate()
    
    def sync_to_hdfs(self):
        """Sync local logs to HDFS"""
        try:
            if not os.path.exists(self.local_log_path):
                return
                
            spark = self._get_spark_session()
            
            # Read logs from local file
            logs = []
            with open(self.local_log_path, 'r') as f:
                for line in f:
                    try:
                        logs.append(json.loads(line.strip()))
                    except:
                        continue
            
            # Write to HDFS with timestamp in path to avoid conflicts
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            # Ensure the directory exists in HDFS
            spark.sql(f"CREATE DIRECTORY IF NOT EXISTS {self.hdfs_log_path}")
            
            # Write to HDFS as a single file
            hdfs_path = f"{self.hdfs_log_path}/requests.log"
            
            # Convert logs to DataFrame with proper schema
            log_data = spark.createDataFrame([
                {
                    'timestamp': log['timestamp'],
                    'level': log['level'],
                    'message': log['message']
                } for log in logs
            ])
            
            # Write as a single file with proper permissions
            log_data.coalesce(1).write \
                .mode("overwrite") \
                .option("compression", "none") \
                .json(hdfs_path)
                
            # Set proper permissions (similar to what's shown in the image)
            spark.sql(f"ALTER FILE {hdfs_path} SET PERMISSION '-rw-r--r--'")
            self.logger.info(f"Logs synced to HDFS: {hdfs_path}")
            
        except Exception as e:
            self.logger.error(f"Failed to sync logs to HDFS: {str(e)}")
    
    def get_recent_logs(self, limit=50):
        """Get recent logs from local file"""
        logs = []
        try:
            if os.path.exists(self.local_log_path):
                with open(self.local_log_path, 'r') as f:
                    # Read lines from end of file
                    lines = f.readlines()[-limit:]
                    for line in lines:
                        try:
                            log_entry = json.loads(line)
                            logs.append(log_entry)
                        except:
                            continue
        except Exception as e:
            self.logger.error(f"Error reading logs: {str(e)}")
        
        return sorted(logs, key=lambda x: x['timestamp'], reverse=True)

    def info(self, message):
        self.logger.info(message)
    
    def warning(self, message):
        self.logger.warning(message)
    
    def error(self, message):
        self.logger.error(message)
