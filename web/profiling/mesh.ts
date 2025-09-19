import { INITIAL_STATE } from "../init.js";
import { Terrain } from "../terrain.js";

const state = INITIAL_STATE;
const terrain = new Terrain(state.chunks, state.noise, state.render);
terrain.recompute();
state.render.mesh({
    at: state.noise.normalised(.01, 1),
    nblocks: 2048,
});
