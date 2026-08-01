FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY backend/followupbussiness/pom.xml backend/followupbussiness/pom.xml
RUN mvn -f backend/followupbussiness/pom.xml -Dmaven.repo.local=/tmp/m2 -DskipTests dependency:go-offline
COPY backend/followupbussiness/src backend/followupbussiness/src
RUN mvn -f backend/followupbussiness/pom.xml -Dmaven.repo.local=/tmp/m2 -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /workspace/backend/followupbussiness/target/followupbussiness-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080 9091
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
