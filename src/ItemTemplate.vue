<template>
  <div>
    <span>{{ item.TITLE || '' }} {{ item.LAST_NAME || '' }} {{ item.NAME || '' }} {{ item.SECOND_NAME || ''  }}</span>
  </div>
</template>

<script>
export default {
  props: {
    item: { required: true },
    searchText: { required: true }
  }
}
</script>
