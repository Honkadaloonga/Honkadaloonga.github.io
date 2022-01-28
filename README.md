# Honkadaloonga.github.io

Source code available [here](https://github.com/Honkadaloonga/Honkadaloonga.github.io).

---

### kaleidoscopic-ifs

A kaleidoscopic iterated function system fractal rendered using WebGL ray marching with a distance estimation formula inspired by [this](https://www.fractalforums.com/sierpinski-gasket/kaleidoscopic-(escape-time-ifs)) thread. The sliders in the top left are responsible for rotating, scaling, and stretching the fractal in 3d space.
- x1, y1 and z1 correspond to the x, y and z axis rotation angles before the kaleidoscopic reflection, whereas x2, y2 and z2 to angles after it.
- ct and cp are the spherical coordinates of the stretching center, and sc is the fractal's scale.

All sliders and the canvas have scrolling functionality.

Of note is that the 'Randomize' button is likely to produce a black screen, since all the values are generated uniformly, without checking if they're going to produce a visible result or not.