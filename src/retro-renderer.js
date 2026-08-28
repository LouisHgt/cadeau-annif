function makeTextureRetro(texture) {

    if(!texture) return;

    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;

    texture.generateMipmaps = false;
    texture.needsUpdate = true;
}

function makeModelRetro(model) {
    model.traverse((object) => {
        if (!object.isMesh) return;

        const material = Array.isArray(object.material) 
            ? object.material 
            : [object.material];

        material.forEach((mat) => {

            mat.flatShading = true
            makeTextureRetro(mat.map);
            mat.needsUpdate = true;
        });
    });
}