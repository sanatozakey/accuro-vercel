@echo off
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-11.0.27.6-hotspot
echo Building Android Release APK...
echo JAVA_HOME is set to: %JAVA_HOME%
gradlew.bat assembleRelease
