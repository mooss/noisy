.PHONY: build run clean dist

build:
	go build -o webserver main.go

clean:
	rm -f webserver
	rm -rf build

dist: clean
	mkdir -p build
	git archive HEAD | tar -x -C build
	cd build && go build -o webserver main.go

run: build
	go run main.go
