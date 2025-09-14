.PHONY: build clean dist run setup

build:
	make -C web build
	go build -o noisy-serve main.go

clean:
	rm -f noisy-serve
	rm -rf build

# Build the commited version of noisy.
clean-build: clean
	mkdir -p build
	git archive HEAD | tar -x -C build
	ln -s $(PWD)/web/node_modules/ $(PWD)/build/web # Reinstalling the dependencies would be too much.
	make -C build/web build

# Clean-build Noisy and package it in the Go binary.
dist: clean-build
	cd build && go build -o noisy-serve main.go

# Run the wrapped app from the current worktree without recompiling the webapp.
run:
	go run main.go

setup:
	make -C web setup
