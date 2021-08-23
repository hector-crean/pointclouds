# Sensat pointcloud
Clone the repo and run `yarn install`
After the successfull installation of the packages: `yarn start`


Map Controls
- right click and drag to pan
- left click and drag to move origin or camera

Pointcloud controls
- double click on point in pointcloud to create a 'halo' visual. This highlights points within a 3m vicinity of the selected point. (points within 1m are highlighted blue, between 1m and 2m are highlighted green, and between 2m and 3m red) 
![Alt text](public/halo.png?raw=true "halo")
![Alt text](public/halo-3d.png?raw=true "3D halo")
- single click a selection of points to create a connected line. Can use this to create a site boundary etc. 
![Alt text](public/line-tool.png?raw=true "line tool")



Postprocessing:
- top right gives some options for different filters to apply to the rendered image



takeways/challenges:

*Preprocessing*

- Preprocessing the pointclouds (i.e. using [https://gltf-transform.donmccurdy.com/index.html](https://gltf-transform.donmccurdy.com/index.html)) is probably the most important step of the entire pipeline, but it not a focus of this exercise. It would likely be useful to have 3 gltf files for each pointcloud: [1] the actual, full resolution pointcloud, [2] a low resolution version, and [3] a convex hull mesh approximation of the pointcloud. A low poly convex hull would be extremely useful when driving interaction with the pointcloud. We could 'shadow' the pointcloud with this convex hull (which we wouldn't render, but would be in the scene graph), enabling easier (and more intuitive) raycasting. In general, as much as we could use rust/webassembly etc. to facilitate fast computations in a browser context, it is far easier to do expensive computations offline.

*Rendering:*

- In thee.js we render points in batches using the Points class. We can discard points (using a global clipping plane etc) if they are not within a geographical point of interest, or denude (i.e. decrease the density of) the points rendered within the fragment shader if it is not directly within the viewer's focus. We can additionally assign the points to different rendering layers, and selectively render layers. This would probably be useful if the gltf meshes were semantically tagged during the preprocessing phase, so we could explicitly assign the 'roof' to layer 1, walls to layer 2 etc. We can alter the appearance of the points in custom frag/vert shaders, but it is probably most efficient to use postprocessing effects to drive ui.

*Raycasting*:

- Raycasting is quite challenging on pointclouds. The effect is less obvious when only using one raycaster, but becomes evident if we are doing things like collision detection, where several raycasters are required. We can use spatial query libraries, and special data structures (such as octrees) to improve their efficacy. If using WebGPU, you could implement a raycaster on the GPU using compute shaders. When creating a 3D measuring tool, the real difficulty is enabling a user to click on points which they are likely to want to measure from. As discussed above, a potential solution is to create a low poly convex hull from the pointcloud, and use this to drive ui/interaction.


