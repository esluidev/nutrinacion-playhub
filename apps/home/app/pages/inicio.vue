<template>
  <!-- El inicio de quien juega (maqueta aprobada por Luis el 2026-11-27: «como una aplicación para niños y
       adolescentes»), todo en cards del kit:
       1. Arriba, «¡Hola, …!» con su avatar y lo que toca ahora: el juego que dejó a medias, con una casilla por escena y
          «Seguir Jugando», o lo más nuevo que no ha terminado, con «Jugar»; a un lado, su portada.
       2. «Explora por tema»: los cuatro temas, en tarjetas neutras del kit con su icono en el color de su área y cuántos
          juegos tiene (Luis: el diseño de dibujos grandes era «completamente para niños»; lo usan también adolescentes).
       3. «Lo más nuevo»: hasta 10 portadas grandes que se deslizan de lado, con su tema, «Terminado» y jugar.
       4. «Unidades de estudio»: hasta 10, cada una con un collage de las portadas de sus juegos.
       Solo lo de su país y su edad. En el teléfono es la misma página, solo ajustada de tamaño (Luis: un diseño aparte
       «parecen 2 aplicaciones distintas»): la portada de arriba pasa sobre el saludo, los temas en dos columnas y las
       tarjetas de las filas, más angostas. -->
  <div class="flex flex-col gap-6">
    <UiAlert v-if="error" tone="warning" :title="t('inicio.error')">
      <UiButton class="mt-3" variant="outline" icon="retry" @click="cargar">{{ t('inicio.reintentar') }}</UiButton>
    </UiAlert>
    <div v-else-if="cargando" class="grid place-items-center py-16"><UiSpinner /></div>
    <template v-else>
      <section class="ui-panel hero">
        <div class="hero-texto">
          <div class="hero-hola">
            <UiAvatar v-if="actual" :name="actual.nombre" :src="dibujoDe(actual.avatar)" :tone="tonoDe(actual.avatar)" size="xl" />
            <h1 class="hero-saludo">{{ t('inicio.saludo', { nombre: actual?.nombre ?? '' }) }}</h1>
          </div>
          <template v-if="seguir">
            <div>
              <p class="eyebrow">{{ seguir.avance ? t('inicio.seguir') : t('inicio.nuevo') }}</p>
              <h2 class="hero-juego">{{ textoEn(seguir.storyboard.titulo, locale) }}</h2>
            </div>
            <div v-if="seguir.avance" class="hero-avance">
              <UiProgress variant="segments" tone="lime" :value="seguir.avance.indice" :max="seguir.avance.escenas" :label="t('inicio.escena', { n: seguir.avance.indice + 1, total: seguir.avance.escenas })" class="min-w-0 flex-1" />
              <span class="ui-caption font-extrabold">{{ t('inicio.escena', { n: seguir.avance.indice + 1, total: seguir.avance.escenas }) }}</span>
            </div>
            <UiButton :to="`/jugar/${seguir.storyboard.clave}`" size="lg" icon="play" class="self-start">{{ seguir.avance ? t('inicio.seguirBoton') : t('inicio.jugar') }}</UiButton>
          </template>
          <p v-else-if="!catalogo.storyboards.length" class="ui-text">{{ t('inicio.vacio') }}</p>
        </div>
        <NuxtLink v-if="seguir" :to="`/jugar/${seguir.storyboard.clave}`" class="hero-portada" :aria-label="textoEn(seguir.storyboard.titulo, locale)">
          <PortadaJuego :storyboard="seguir.storyboard" />
        </NuxtLink>
      </section>

      <section class="ui-panel seccion">
        <div class="ui-panel-header"><h2 class="ui-title">{{ t('inicio.temas') }}</h2></div>
        <div class="temas">
          <NuxtLink v-for="tema in temas" :key="tema.categoria" :to="`/explorar?tema=${tema.categoria}`" class="select-card tema">
            <UiSymbol :icon="tema.icono" v-bind="uiAreaAttrs(tema.area)" size="md" />
            <span class="min-w-0 flex-1">
              <span class="block font-black leading-tight text-ink">{{ t(`categoria.${tema.categoria}`) }}</span>
              <span class="ui-caption block">{{ tema.juegos === 0 ? t('tema.sinJuegos') : tema.juegos === 1 ? t('unidad.juego') : t('unidad.juegos', { n: tema.juegos }) }}</span>
            </span>
            <UiIcon name="chevron-right" class="size-4 shrink-0 text-muted" />
          </NuxtLink>
        </div>
      </section>

      <section v-if="nuevos.length" class="ui-panel seccion">
        <div class="ui-panel-header">
          <h2 class="ui-title">{{ t('inicio.recientes') }}</h2>
          <UiButton to="/explorar" variant="outline" size="sm">{{ t('inicio.verTodo') }}</UiButton>
        </div>
        <div class="fila-deslizable">
          <TarjetaStoryboard v-for="s in nuevos" :key="s.clave" :storyboard="s" />
        </div>
      </section>

      <section v-if="unidades.length" class="ui-panel seccion">
        <div class="ui-panel-header">
          <h2 class="ui-title">{{ t('inicio.unidades') }}</h2>
          <UiButton to="/unidades" variant="outline" size="sm">{{ t('inicio.verTodo') }}</UiButton>
        </div>
        <div class="fila-deslizable">
          <TarjetaUnidad v-for="u in unidades" :key="u.id" :unidad="u" :storyboards="catalogo.storyboards" />
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { paraSeguir, POR_FILA, recientes, textoEn } from '~/utils/catalogo'
import { TEMAS } from '~/utils/temas'

const { t, locale } = useT()
const { actual, avanceDelActual, terminadosDelActual } = useHogar()
const { catalogo, cargando, error, cargar } = useCatalogo()
useHead({ title: () => t('inicio.recientes') })

const seguir = computed(() => paraSeguir(catalogo.value.storyboards, avanceDelActual.value, terminadosDelActual.value))
// Siempre los cuatro temas, con cuántos juegos tiene cada uno para este perfil.
const temas = computed(() => TEMAS.map(tema => ({ ...tema, juegos: catalogo.value.storyboards.filter(s => s.categoria === tema.categoria).length })))
const nuevos = computed(() => recientes(catalogo.value.storyboards))
const unidades = computed(() => catalogo.value.unidades.slice(0, POR_FILA))
</script>
