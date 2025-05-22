@echo off
REM Hadoop Script Access Test
echo Hadoop Script Access Test
echo ==========================

echo Checking script directory in namenode container...
docker exec namenode ls -la /hadoop/scripts

echo.
echo Checking script file permissions...
docker exec namenode ls -la /hadoop/scripts/load_data_to_hdfs.sh

echo.
echo Executing script file...
docker exec namenode bash -c "chmod +x /hadoop/scripts/load_data_to_hdfs.sh && /hadoop/scripts/load_data_to_hdfs.sh"

echo.
echo Checking presence of files in HDFS...
docker exec namenode hdfs dfs -ls /user/hadoop/agri_predict/raw/

echo.
echo Test completed.
echo If all steps succeeded, Hadoop scripts are mounted and executable.
pause
