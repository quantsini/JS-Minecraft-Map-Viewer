This is a rudimentary Minecraft viewer using the Three.js WebGL framework.

You can pretty much download this, and open up index.html to see an example map I generated in my singleplayer game.

You should be able to drag (multiple) .mcr files directly from your single player games into the area indicated in index.html.

Issues:
loading chunks is really slow - i just implemented a naive way to load them


Ideas for making the rendering more efficient
- Use Typed Arrays in the computation and handling of chunks
- Use Web Workers to compute geometry data for chunks
- Local optimizations (such as clever data structure management)


TODO:
 high priority
   * refactoring
   * make the rendering more efficient
   * better controls
 medium priority
   * be able to read on server minecarft data, perhaps as a node.js or php script
 maybe do this?
   * implement physics and collision detection? (don't want to turn this into a minecraft clone)
   * editing tools - remove, add, change blocks, similar to mcedit
   * orthographic view


Uses components from https://github.com/endenizen/MC-Chunk-Loader
namely the NBT loader.