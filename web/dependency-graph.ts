const madge = require('madge');

madge('ainulindale.js').then((res) => {
	console.log(res.obj());
});
