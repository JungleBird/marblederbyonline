import * as THREE from 'three'

export const SceneEnvironment = (scene, sceneMeshes) => {
  // Helper to create simple meshes
  const createMesh = (geometry, position, rotation) => {
    const material = new THREE.MeshNormalMaterial({ side: THREE.DoubleSide })
    const mesh = new THREE.Mesh(geometry, material)
    if (position) mesh.position.set(...position)
    if (rotation) mesh.rotation.set(...rotation)
    scene.add(mesh)
    sceneMeshes.push(mesh)
    return mesh
  }

  // Environment
  createMesh(new THREE.PlaneGeometry(10, 10), [0, -1, 0], [-Math.PI / 2, 0, 0]) // Floor
  createMesh(new THREE.PlaneGeometry(10, 10), [0, 3, 0], [Math.PI / 2, 0, 0])  // Ceiling
  createMesh(new THREE.PlaneGeometry(2, 2), [4, 0, 0], [0, -Math.PI / 2, 0])   // Wall 1
  createMesh(new THREE.PlaneGeometry(2, 2), [0, 0, -3], [0, 0, 0])             // Wall 2
  createMesh(new THREE.BoxGeometry(), [-3, 0, 0])                              // Cube
}
