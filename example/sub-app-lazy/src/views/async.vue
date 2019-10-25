<template>
  <div style="padding: 20px">
    <p>The following component was lazy loaded from 'Demo' sub-application.</p>
    <AsyncExample></AsyncExample>
  </div>
</template>

<script>
import VueMfe from '../../../../src'

export default {
  name: 'AsyncComponent',
  components: {
    AsyncExample: () => VueMfe.Lazy('demo.components.Example')
  }
}
</script>
