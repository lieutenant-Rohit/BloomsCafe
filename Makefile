JAVA_HOME := /Users/root1/Library/Java/JavaVirtualMachines/temurin-21.0.11/Contents/Home

.PHONY: build run stop

build:
	npm --prefix frontend run build
	rm -rf src/main/resources/static
	mkdir -p src/main/resources/static
	cp -r frontend/dist/* src/main/resources/static/
	./mvnw -q -DskipTests package

run: build
	-lsof -ti tcp:8080 | xargs kill -9
	nohup $(JAVA_HOME)/bin/java -jar target/BloomsCafe-0.0.1-SNAPSHOT.jar > /tmp/blooms-8080.log 2>&1 &
	@sleep 8
	@echo "Single instance started on port 8080 (API + frontend)"

stop:
	-lsof -ti tcp:8080 | xargs kill -9
	@echo "Stopped"
