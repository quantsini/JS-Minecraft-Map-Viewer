## JS Minecraft Map Viewer
# What is this?
This is a minecraft maper viewer written entirely in HTML5, Javascript and WebGL.
# What does it do?
You can load region files from your minecraft save files and it'll load them and show you a 3 dimensional view of your map, as if you were flying through the map in game
# What it does not do?
It's not minecraft for the web browser.
# Other Info
* Only loads region files in the Anvil format (Minecraft 1.2).
* Some textures are not implemented, such as sand, sandstone, brick, etc.
* Texture IDs are not implemented.
* It's very slow (no web workers used, but may consider using them in the future).
* Some chunks may not be rendered on first load. Just move around and they should appear.
