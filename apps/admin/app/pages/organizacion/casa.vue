<template>
  <div>
    <ContenidoCasa ambito="organizacion">
      <!-- El perfil público: lo que ven las familias en «Unirme» -->
      <section class="ui-panel mb-6">
        <div class="ui-panel-header">
          <div class="min-w-0">
            <h2 class="ui-title">{{ t('casa.profileTitle') }}</h2>
            <p class="ui-caption mt-0.5">{{ t('casa.profileDesc') }}</p>
          </div>
        </div>
        <div class="ui-panel-body space-y-4">
          <UiSwitch v-model="perfil.publico" :label="t('casa.profilePublic')" />
          <UiTextarea v-model="perfil.descripcion" :label="t('casa.profileDescription')" :rows="2" />
          <UiInput v-model="perfil.logo" :label="t('casa.profileLogo')" placeholder="https://" />
          <div class="flex justify-end">
            <!-- Secundaria: la acción principal de la vista es Publicar -->
            <UiButton variant="outline" :loading="guardandoPerfil" icon="check" @click="guardarPerfil">{{ t('common.save') }}</UiButton>
          </div>
        </div>
      </section>
    </ContenidoCasa>
  </div>
</template>

<script setup lang="ts">
// «Para casa» de la organización: su perfil público y lo que ofrece a los participantes de todas
// sus comunidades. Solo para sus administradores (el middleware de /organizacion lo exige).
definePageMeta({ layout: 'dashboard' })

const { t } = useT()
const { toast } = useToast()
const { orgActiva } = useContexto()
const { getPerfilPublico, guardarPerfilPublico } = usePublicaciones()

const perfil = reactive({ publico: false, descripcion: '', logo: '' })
const guardandoPerfil = ref(false)

watch(() => orgActiva.value?.id, async (id) => {
  if (!id) return
  const datos = await getPerfilPublico(id)
  perfil.publico = datos?.perfil_publico ?? false
  perfil.descripcion = datos?.descripcion_publica?.es ?? ''
  perfil.logo = datos?.logo ?? ''
}, { immediate: true })

async function guardarPerfil() {
  if (!orgActiva.value) return
  guardandoPerfil.value = true
  const { error } = await guardarPerfilPublico(orgActiva.value.id, {
    publico: perfil.publico,
    descripcion: perfil.descripcion.trim() ? { es: perfil.descripcion.trim() } : null,
    logo: perfil.logo,
  })
  guardandoPerfil.value = false
  if (error) { toast.error(error); return }
  toast.success(t('casa.profileSaved'))
}
</script>
