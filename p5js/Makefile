.PHONY: serve/% refresh/%

refresh/%: %.js
	./refresh.bash $<

serve/%: %.js refresh/%
	p5 serve $<
