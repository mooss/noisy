.PHONY: build run clean dist setup

build:
	make -C web build
	go build -o noisy-serve main.go

clean:
	rm -f noisy-serve
	rm -rf build

dist: clean
	mkdir -p build
	git archive HEAD | tar -x -C build
	ln -s $(PWD)/web/node_modules/ $(PWD)/build/web # Reinstalling the dependencies would be too much.
	make -C build/web build
	cd build && go build -o noisy-serve main.go

# Run the wrapped app from the current worktree without recompiling the webapp.
run:
	go run main.go

setup:
	make -C web setup
