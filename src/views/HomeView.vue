<script setup lang="ts">
import FileUploader from '@/components/public/FileUploader.vue'
import { ref } from 'vue'
const uploadInfo = ref<{ url: string; thumbnailUrl?: string } | null>(null)
</script>

<template>
  <div class="flex items-center justify-center mt-20">
    <FileUploader
      v-model:uploadInfo="uploadInfo"
      belongTo="mindmap"
      :maxHeight="5000"
      :maxWidth="5000"
      :quality="0.7"
      :generateThumbnail="true"
      :thumbnailMaxWidth="400"
      :thumbnailMaxHeight="800"
      :thumbnailQuality="0.8"
    />
  </div>
</template>
