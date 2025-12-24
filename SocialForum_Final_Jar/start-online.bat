@echo off
echo Starting Social Forum in ONLINE mode (Connecting to AWS RDS)...
java -jar app.jar --spring.profiles.active=mysql
pause
