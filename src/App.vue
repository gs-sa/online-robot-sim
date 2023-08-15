<script setup lang="ts">
import { onMounted, ref } from "vue";
import { build_robot_renderer, robot_renderer } from "./ts/renderer";
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
const container = ref<HTMLDivElement | null>(null);
onMounted(() => {
  if (container.value !== null) {
    build_robot_renderer(container.value);
  }
})
const handel_export = () => {
  let exporter = new GLTFExporter();
  if (robot_renderer === null) {
    return;
  }
  exporter.parse(robot_renderer.robot, function (gltf) {
    function downloadFile(blob: Blob, fileName: string) {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
    }

    if (gltf instanceof ArrayBuffer) {
      downloadFile(new Blob([gltf], { type: 'application/octet-stream' }), "robot.glb");
    }

  }, () => { }, {
    trs: true,
    onlyVisible: true,
    binary: true,
  });
}
</script>

<template>
  <div style="position: absolute; color: white; padding-left: 1em;">
    <h1>franka panda ik</h1>
    <h2>press r to rotate, press t to translate</h2>
    <button @click="handel_export"> export gltf</button>
  </div>
  <div ref="container"></div>
</template>

<style scoped></style>
