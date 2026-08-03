JAVA_HOME := /Users/root1/Library/Java/JavaVirtualMachines/temurin-21.0.11/Contents/Home

.PHONY: run3 stop

run3:
	-lsof -ti tcp:8080 -ti tcp:8081 -ti tcp:8082 -ti tcp:8083 | xargs kill -9
	ln -sf $(PWD)/config/nginx-bloomscafe.conf /opt/homebrew/etc/nginx/servers/bloomscafe.conf
	-nginx -s quit 2>/dev/null; nginx
	nohup $(JAVA_HOME)/bin/java -jar target/BloomsCafe-0.0.1-SNAPSHOT.jar --server.port=8081 > /tmp/blooms-8081.log 2>&1 &
	nohup $(JAVA_HOME)/bin/java -jar target/BloomsCafe-0.0.1-SNAPSHOT.jar --server.port=8082 > /tmp/blooms-8082.log 2>&1 &
	nohup $(JAVA_HOME)/bin/java -jar target/BloomsCafe-0.0.1-SNAPSHOT.jar --server.port=8083 > /tmp/blooms-8083.log 2>&1 &
	@sleep 8
	@echo "3 instances started on ports 8081, 8082, 8083"

stop:
	-lsof -ti tcp:8080 -ti tcp:8081 -ti tcp:8082 -ti tcp:8083 | xargs kill -9
	@echo "Stopped"
