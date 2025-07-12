.PHONY: build run clean dist setup

build:
	go build -o webserver main.go

clean:
	rm -f webserver
	rm -rf build

dist: clean
	mkdir -p build
	git archive HEAD | tar -x -C build
	ln -s $(PWD)/web/node_modules/ $(PWD)/build/web # Reinstalling the dependencies would be too much.
	make -C build/web build
	cd build && go build -o webserver main.go

# Run the wrapped app from the current worktree without recompiling the webapp.
run:
	go run main.go

setup:
	make -C web setup
