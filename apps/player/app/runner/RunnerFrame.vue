<template>
  <!-- El taller (PLAYER-DESIGN.md). Una escena = plantilla + contenido. El modo cambia el marco,
       nunca la escena:
       - educator: la pantalla del taller. Conduce, pausa, reinicia, abre la guía y ve quién está
         conectado; puede pausar, reiniciar o quitar un dispositivo.
       - device: el dispositivo de un participante. No navega: la sesión le manda escena, pausa y
         reinicios; la actividad y su feedback se quedan ahí.
       - home: uso autónomo, en casa: el niño recorre el storyboard por su cuenta. Vuelve a la escena anterior cuando
         quiere y pasa a la siguiente cuando termina el juego de la escena.
       - preview: solo el escenario (consigna, juego y su hoja de feedback), para mirar un storyboard
         desde Admin: sin consola ni sesión. Conduce la app que lo incrusta (`ir` y `reiniciar`,
         docs/runner.md). Sin bandas: la escena ocupa todo el alto y la hoja de feedback sube sobre ella
         (runner.css, useFrameFit).
       La consola flota sobre el escenario, un elemento por esquina, todos del alto de un control y sin
       puntos ni tiempo:
       - Arriba a la izquierda, el avance del taller: en el educador, un desplegable con las escenas; en casa, la misma
         pieza sin desplegable. En un dispositivo, quién juega (PerfilPieza): su avatar y su apodo, en una pieza blanca
         como las demás.
       - Arriba a la derecha, Ajustes · Reiniciar · Salir en un solo bloque. Ajustes abre su riel: en el educador,
         pausa, sonido, pantalla completa (donde se puede) y dispositivos; en casa, sonido y pantalla completa.
       - Abajo, sobre la banda del pie: a la izquierda, la consigna (escuchar y su texto), siempre a la vista; a la
         derecha, la navegación en un bloque: Guía (educador) o Anterior (casa) y Siguiente, que
         lleva el icono de reproducir (Terminar, el check). En casa los dos se activan según la escena: Anterior, desde
         la segunda; Siguiente, cuando el juego de la escena está hecho. En el educador, Anterior queda en las teclas
         (← y Re Pág) y en la lista. La hoja de feedback sube sobre el pie, siempre con escuchar y cerrar: nunca lleva
         Siguiente.
       La sesión se simula entre pestañas del mismo navegador (BroadcastChannel). Del dispositivo solo
       vuelve su presencia, nunca respuestas, intentos ni si terminó. -->
  <main
    ref="frame"
    class="player-frame"
    data-density="touch"
    :data-mode="mode"
    :data-feedback="feedbackType"
    :data-compact="compact || undefined"
    :data-loading="!loaded || undefined"
    :data-entering="entering || undefined"
    :aria-label="txt('workshop')"
    :aria-busy="!loaded"
  >
    <header v-if="mode !== 'preview'" class="player-bar" :aria-label="txt('workshopBar')" :inert="Boolean(overlay)">
      <div class="bar-start">
        <!-- En un dispositivo, quién es: un animal que no sobrevive a la sesión (o, desde la app del hogar, el perfil
             del niño). Sin «Listo» al completar la escena (Luis, 2026-11-26). -->
        <PerfilPieza v-if="mode === 'device' && me" :avatar="me.avatar" :nombre="me.nombre" :tono="me.tono" />
        <!-- En casa, dónde va el storyboard y quién juega: la pieza del avance del educador, sin desplegable (el niño va
             escena a escena con Anterior y Siguiente), con el avatar del niño en el sitio de la claqueta, sin apodo
             (Luis, 2026-11-20: «el avatar da contexto del niño y siempre se mantiene el progreso»). El avatar, con la
             forma del de la pieza del perfil: la cabeza del animal en un círculo con el tinte de su tono. -->
        <div
          v-else-if="mode === 'home'"
          ref="sceneCard"
          class="hud-piece scene-card home-card"
          role="group"
          :aria-label="`${player.apodo} · ${txt('sceneProgress', { n: current + 1, total: scenes.length, percent })}`"
          :title="`${player.apodo} · ${sceneCaption()}`"
        >
          <span class="profile-avatar" :data-tone="AVATAR_TONES[player.avatar]" aria-hidden="true">
            <img :src="dibujoDe(player.avatar)" alt="" decoding="sync">
          </span>
          <UiProgress class="scene-card-bar" :value="percent" tone="lime" :label="txt('workshopProgress')" />
        </div>
        <!-- En el educador (la vista previa no tiene barra), dónde va el taller: la barra de avance del kit, del alto
             de un botón, en un desplegable (su chevron lo dice) que lista las escenas. Al completar un juego, la pieza
             da un pequeño salto mientras la barra crece. -->
        <button
          v-else
          ref="sceneCard"
          type="button"
          class="hud-piece scene-card scenes-button"
          aria-haspopup="listbox"
          :aria-expanded="scenesOpen"
          :aria-label="txt('sceneProgress', { n: current + 1, total: scenes.length, percent })"
          :title="sceneCaption()"
          @click="setScenes(!scenesOpen)"
        >
          <UiIcon name="clapperboard" class="scene-card-icon" data-tone="sky" aria-hidden="true" />
          <UiProgress class="scene-card-bar" :value="percent" tone="lime" :label="txt('workshopProgress')" />
          <UiIcon name="chevron-down" class="scene-card-chevron" aria-hidden="true" />
        </button>
      </div>
      <!-- En un dispositivo no hay consigna: la dice el educador y está en su pantalla principal (Luis, 2026-11-26); ni nada
           narrado. El pie queda en su suelo y el tablero gana el alto. -->
      <div class="bar-end">
        <!-- En un dispositivo, lo suyo en el mismo bloque: Pantalla completa (donde el navegador la permite) y Salir,
             que lo saca solo a él del taller. -->
        <div v-if="mode === 'device'" class="hud-group hud-tools" role="group" :aria-label="txt('tools')">
          <UiButton
            v-if="canFullscreen"
            tone="neutral"
            :icon="fullscreen ? 'compress' : 'expand'"
            icon-only
            :aria-pressed="fullscreen"
            :label="fullscreen ? txt('exitFullscreen') : txt('fullscreen')"
            :title="fullscreen ? txt('exitFullscreen') : txt('fullscreen')"
            @click="toggleFullscreen"
          />
          <!-- Sin pantalla completa (iPhone), Salir va solo, con su nombre y del ancho de los dos, como la pieza del perfil -->
          <UiButton tone="neutral" icon="exit" :icon-only="canFullscreen" class="exit-button" :label="txt('exit')" :title="txt('exit')" :disabled="session.left || session.removed" @click="askLeave">{{ canFullscreen ? undefined : txt('exitShort') }}</UiButton>
        </div>
        <!-- Lo del taller en un solo bloque: Ajustes, Reiniciar la escena y Salir (su icono en coral). En el taller en vivo,
             Dispositivos en el sitio de Salir, que pasa a Ajustes (Luis, 2026-11-26: el panel quedaba escondido en Ajustes y
             costaba llegar a él). En el ensayo y en casa no hay dispositivos: Salir se queda. -->
        <div v-if="mode !== 'device'" class="hud-group hud-tools" role="group" :aria-label="txt('tools')">
          <UiButton
            tone="neutral"
            :icon="railOpen ? 'close' : 'settings'"
            icon-only
            class="settings-button"
            :aria-expanded="railOpen"
            :label="railOpen ? txt('closeSettings') : txt('settings')"
            :title="txt('settings')"
            @click="setRail(!railOpen)"
          />
          <!-- Reiniciar la escena; en el taller en vivo, en Ajustes (Luis, 2026-11-26), y aquí pausar o liberar los dispositivos -->
          <UiButton v-if="!withDevices" tone="neutral" icon="retry" icon-only :label="txt('restartScene')" :title="txt('restartScene')" @click="askRestart" />
          <!-- Pausar o liberar los dispositivos de una vez, junto a Dispositivos (Luis, 2026-11-26): cada escena que no es
               la primera ni la última empieza con ellos en pausa, y aquí se liberan cuando el educador ya explicó. Un
               candado, cerrado con ellos en pausa y abierto sin ella; sin color (Luis, 2026-11-26: ni el botón ni el
               icono cambian de color). -->
          <UiButton
            v-if="withDevices"
            tone="neutral"
            :icon="dispositivosEnPausa ? 'lock' : 'lock-open'"
            icon-only
            class="devices-pause"
            :aria-pressed="dispositivosEnPausa"
            :label="dispositivosEnPausa ? txt('freeDevices') : txt('pauseDevices')"
            :title="dispositivosEnPausa ? txt('freeDevices') : txt('pauseDevices')"
            @click="pauseAllDevices"
          />
          <UiButton
            v-if="withDevices"
            tone="neutral"
            icon="devices"
            icon-only
            class="devices-button"
            :aria-expanded="devicesOpen"
            :label="solicitudes.length ? txt('requestsCount', { n: solicitudes.length }) : txt('devicesCount', { n: deviceViews.length })"
            :title="txt('devices')"
            @click="setDevices(!devicesOpen)"
          />
          <UiButton v-else tone="neutral" icon="exit" icon-only class="exit-button" :label="txt('exit')" :title="txt('exit')" @click="askExit" />
        </div>
        <!-- El número de Dispositivos (Luis, 2026-11-26): en cielo, con las esquinas redondeadas, con su origen arriba a la
             derecha de su icono y creciendo a la derecha, así que cabe un 100. Quienes piden entrar, si los hay (lo que
             hay que atender, aunque el panel esté cerrado); si no, los conectados. Hasta 99; más, «99+» (el número exacto,
             en el nombre del botón y en el panel). Fuera del bloque, que recorta lo de dentro. -->
        <span
          v-if="withDevices && (solicitudes.length || deviceViews.length)"
          class="devices-count"
          data-tone="sky"
          aria-hidden="true"
        >{{ cifraCorta(solicitudes.length || deviceViews.length) }}</span>
        <!-- Riel de ajustes: cuelga del engranaje, dentro de la barra para quedar siempre bajo él aunque el bloque crezca
             (el número de Dispositivos con muchas solicitudes). En el educador, la pausa, el sonido y la pantalla y, en el taller en vivo,
             Reiniciar la escena junto a la pausa y Salir al final (sus sitios en la barra son del candado y de
             Dispositivos); en casa, lo que usa el niño: el sonido y la pantalla. -->
        <div v-if="railOpen" class="quick-rail" role="toolbar" aria-orientation="vertical" :aria-label="txt('settings')">
          <UiButton v-if="mode === 'educator'" tone="neutral" icon="pause" icon-only :label="txt('pause')" :title="txt('pauseKey')" @click="fromRail(() => setPause('manual', true))" />
          <!-- En el taller en vivo, Reiniciar la escena va aquí, junto a la pausa (su sitio en la barra es del candado) -->
          <UiButton v-if="withDevices" tone="neutral" icon="retry" icon-only :label="txt('restartScene')" :title="txt('restartScene')" @click="fromRail(askRestart)" />
          <UiButton
            tone="neutral"
            :icon="muted ? 'muted' : 'sound'"
            icon-only
            :aria-pressed="muted"
            :label="muted ? txt('unmute') : txt('mute')"
            :title="muted ? txt('unmute') : txt('mute')"
            @click="toggleMute"
          />
          <UiButton
            v-if="canFullscreen"
            tone="neutral"
            :icon="fullscreen ? 'compress' : 'expand'"
            icon-only
            :aria-pressed="fullscreen"
            :label="fullscreen ? txt('exitFullscreen') : txt('fullscreen')"
            :title="fullscreen ? txt('exitFullscreen') : txt('fullscreen')"
            @click="toggleFullscreen"
          />
          <UiButton v-if="withDevices" tone="neutral" icon="exit" icon-only class="exit-button" :label="txt('exit')" :title="txt('exit')" @click="fromRail(askExit)" />
        </div>
      </div>
    </header>

    <!-- El escenario y sus piezas toman el tono del área del storyboard (runner.css). -->
    <div ref="stage" class="player-stage" tabindex="-1" :data-area="storyboard.category" :inert="Boolean(overlay)">

      <template v-for="(scene, i) in scenes" :key="`${scene.folder}-${states[i]!.generation}`">
        <template v-if="states[i]!.visited || states[i]!.warm">
          <!-- Toda escena, también la Bienvenida (Anuncio), se compone en el tablero de 1280 × 600. Se ve cuando está
               completa (data-pending, useSceneLoad). La que viene se monta por adelantado (data-warm): oculta pero con
               su sitio, para que sus personajes ya estén pintados cuando toque verla. -->
          <section
            v-show="i === current || !states[i]!.visited"
            class="tb-scene"
            :aria-label="scene.title"
            :data-scene="i"
            :data-pending="!sceneLoad.scenes[i]!.shown || undefined"
            :data-warm="i !== current || undefined"
          >
            <div class="tb-board" :data-template="scene.json.template ?? 'propia'" :data-blocked="i !== current || blocked || undefined">
              <component
                :is="sceneComponent(scene)"
                :ref="(el: any) => setInstance(i, el)"
                v-bind="templateProps(scene, i)"
                @feedback="(p: FeedbackPayload) => onFeedback(i, p)"
                @progress="(v: number) => onProgress(i, v)"
                @complete="onComplete(i)"
              />
            </div>
          </section>
        </template>
      </template>

      <!-- Chispas al completar un juego: salen del centro del tablero y caen. Sin texto. -->
      <div v-if="burst" :key="burst" class="spark-burst" aria-hidden="true">
        <span v-for="n in SPARKS" :key="n" class="spark" :data-tone="SPARK_TONES[n % SPARK_TONES.length]" :style="sparkStyle(n)" />
      </div>

      <RunnerGuide
        v-if="guideOpen"
        :scene="active"
        :total="scenes.length"
        :category="storyboard.category"
        :guide="guide?.[active.folder] ?? null"
        :locale="locale"
        @close="setGuide(false)"
      />

      <!-- Las escenas (educador): el menú del kit bajo el avance. Arriba, la cabecera de tarjeta con el
           taller (su nombre en hasta dos líneas). Debajo, una fila por escena que lleva a ella; su insignia
           dice cómo va: hecha (check en lima), la actual (su número en sol, lleno) o pendiente (su número,
           neutro). -->
      <div v-if="scenesOpen" class="ui-listbox scene-list" role="listbox" data-tone="sun" :aria-label="txt('workshopProgress')">
        <div class="ui-panel-header scene-list-head">
          <p class="panel-label">{{ txt('workshop') }}</p>
          <p class="scene-list-title" :title="text(storyboard.json.title)">{{ text(storyboard.json.title) }}</p>
        </div>
        <div class="scene-list-rows">
          <button
            v-for="(scene, i) in scenes"
            :key="scene.folder"
            type="button"
            role="option"
            class="ui-option scene-option"
            :data-state="sceneState(i)"
            :aria-selected="i === current"
            :aria-label="txt('announceScene', { n: i + 1, name: scene.title })"
            :title="scene.title"
            @click="jumpTo(i)"
          >
            <span class="scene-option-label">
              <span class="ui-symbol ui-symbol-sm scene-option-num" :data-tone="SCENE_TONES[sceneState(i)]" aria-hidden="true">
                <UiIcon v-if="sceneState(i) === 'done'" name="check" />
                <template v-else>{{ i + 1 }}</template>
              </span>
              <span class="scene-option-name">{{ scene.title }}</span>
            </span>
          </button>
        </div>
      </div>


      <RunnerDevices
        v-if="devicesOpen"
        :devices="deviceViews"
        :selected="selectedDevice"
        :locale="locale"
        :conexion="conexionVista"
        :solicitudes="solicitudes"
        :sin-aprobar="sinAprobar"
        :todos-en-pausa="dispositivosEnPausa"
        @close="setDevices(false)"
        @select="(id) => selectedDevice = id"
        @pause="pauseDevice"
        @pause-all="pauseAllDevices"
        @restart-all="askRestartAllDevices"
        @restart="restartDevice"
        @remove="askRemoveDevice"
        @aprobar="aprobar"
        @rechazar="rechazar"
        @sin-aprobar="setSinAprobar"
      />
    </div>

    <footer class="player-footer" :inert="Boolean(overlay)">
      <!-- La consigna, siempre a la vista, abajo a la izquierda (Luis, 2026-11-20): escuchar y su texto plano, como cuando
           iba arriba, en una fila sobre el tablero que le quitaba sitio y atención al juego. Se aparta con la navegación
           mientras sube una hoja. -->
      <div class="footer-start">
        <!-- Al cerrar la última escena, su cierre (la invitación de la Despedida) ocupa el lugar de la consigna: su título y,
             debajo, su texto, con su voz; no sube hoja. -->
        <div v-if="mode !== 'preview' && mode !== 'device' && closing" class="consigna is-closing">
          <UiButton tone="sky" class="listen-button" icon="sound" icon-only :label="txt('listen')" :title="txt('listen')" @click="listen(closing.voice)" />
          <p class="consigna-text consigna-cierre" aria-live="polite">
            <strong>{{ closing.title }}</strong>
            <span v-if="closing.body">{{ closing.body }}</span>
          </p>
        </div>
        <div v-else-if="mode !== 'preview' && mode !== 'device' && hasInstruction" class="consigna">
          <UiButton tone="sky" class="listen-button" icon="sound" icon-only :label="txt('listenInstruction')" :title="txt('listen')" @click="listen(introOf(active))" />
          <p class="consigna-text" aria-live="polite">{{ text(active.json.meta.instruction) }}</p>
        </div>
      </div>
      <!-- La hoja del feedback: sube sobre el pie con el tinte del tono de su tipo. -->
      <span class="feedback-sheet" :data-tone="look.tone" aria-hidden="true" />
      <div class="feedback-slot">
        <!-- El feedback sube sobre el pie, en el tono de su tipo; los controles se apartan hasta cerrarlo. -->
        <div
          ref="feedbackEl"
          class="ui-feedback"
          :data-tone="look.tone"
          :data-visible="Boolean(message)"
          role="status"
          aria-live="polite"
        >
          <span class="ui-feedback-symbol" aria-hidden="true"><UiIcon :name="look.icon" /></span>
          <div class="ui-feedback-body">
            <strong>{{ message?.title }}</strong>
            <p v-if="message?.body" class="sheet-text">{{ message.body }}</p>
          </div>
          <div class="feedback-actions">
            <!-- Escuchar, en todos los modos menos el dispositivo: ahí no suena nada narrado -->
            <UiButton v-if="mode !== 'device'" :tone="look.tone" class="listen-button" icon="sound" icon-only :label="txt('listen')" :title="txt('listen')" @click="listen(message?.voice ?? [])" />
            <UiButton :tone="look.tone" icon="close" icon-only :label="txt('closeEsc')" :title="txt('closeEsc')" @click="closeFeedback()" />
          </div>
        </div>
      </div>
      <!-- La navegación, abajo a la derecha: dos botones de solo icono, separados como los de la hoja del feedback, para que
           deje sitio a la consigna (Luis, 2026-11-20; juntos en un bloque se veían como un solo elemento): en el taller,
           Guía y Siguiente en blanco; en casa, Anterior y Siguiente en cielo, para que el niño los encuentre de un vistazo. Anterior y Siguiente llevan un
           ángulo, como en iOS, porque el triángulo de reproducir parecía un botón de reproducir y no de avanzar (Luis,
           2026-11-21). Terminar, el check; en casa queda desactivado hasta que el juego de la escena está hecho, y Anterior, en la
           primera escena. Su nombre está en su etiqueta y en su título. -->
      <div v-if="leads" class="footer-end">
        <div class="footer-nav" role="group" :aria-label="txt('navigation')">
          <UiButton v-if="mode === 'educator'" tone="neutral" icon="book" icon-only :label="txt('guide')" :aria-expanded="guideOpen" :title="txt('guideKey')" @click="setGuide(!guideOpen)" />
          <UiButton
            v-else
            class="previous-button"
            tone="sky"
            icon="chevron-left"
            icon-only
            :label="`${txt('previous')}: ${scenes[current - 1]?.title ?? ''}`"
            :disabled="current === 0"
            :title="txt('previousKey')"
            @click="previous"
          />
          <UiButton
            ref="nextButton"
            class="next-button"
            :class="{ 'is-chevron': !isLast }"
            :tone="finishReady ? 'lime' : mode === 'home' ? 'sky' : 'neutral'"
            :icon="isLast ? 'check' : 'chevron-right'"
            icon-only
            :label="isLast ? txt('finishWorkshop') : `${nextLabel}: ${upcoming?.title ?? ''}`"
            :disabled="!canAdvance"
            :title="txt('nextKey')"
            @click="next"
          />
        </div>
      </div>
    </footer>

    <!-- Ventana sobre todo el marco: la pausa del educador y, en un dispositivo, los estados de la sesión. -->
    <div v-if="overlay && !overlay.rotate" class="scene-overlay">
      <section class="panel-window" :aria-labelledby="`${uid}-overlay`">
        <div class="panel-head">
          <span class="ui-symbol window-symbol" :data-tone="overlay.tone" aria-hidden="true"><UiIcon :name="overlay.icon" /></span>
          <div class="window-titles">
            <p v-if="overlay.caption" class="panel-caption">{{ overlay.caption }}</p>
            <h2 :id="`${uid}-overlay`" class="ui-heading">{{ overlay.title }}</h2>
          </div>
          <UiButton v-if="overlay.action" tone="neutral" size="sm" icon="close" icon-only :label="txt('continue')" @click="resume" />
        </div>
        <p v-if="overlay.text" class="window-text">{{ overlay.text }}</p>
        <div v-if="overlay.action" class="window-actions">
          <UiButton ref="overlayAction" icon="play" @click="resume">{{ txt('continue') }}</UiButton>
        </div>
        <div v-else-if="overlay.cta" class="window-actions">
          <UiButton ref="overlayAction" :icon="overlay.cta.icon" @click="overlay.cta.run">{{ overlay.cta.label }}</UiButton>
        </div>
      </section>
    </div>

    <!-- Teléfono en vertical: una pantalla entera, fuera del marco (a la medida del teléfono, sin su zoom) -->
    <Teleport to="body">
      <div v-if="overlay?.rotate" class="rotate-screen" data-density="touch" :data-area="storyboard.category" role="dialog" aria-modal="true" :aria-label="overlay.title">
        <span class="rotate-phone" data-tone="sky" aria-hidden="true"><UiIcon name="smartphone" /></span>
        <h2 class="rotate-title">{{ overlay.title }}</h2>
        <UiButton v-if="overlay.cta" :icon="overlay.cta.icon" @click="overlay.cta.run">{{ overlay.cta.label }}</UiButton>
      </div>
    </Teleport>

    <p class="sr-only" role="status" aria-live="polite" aria-atomic="true">{{ announcement }}</p>

    <RunnerWindow
      v-model:open="confirmOpen"
      :title="confirmation.title"
      :caption="confirmation.caption"
      :text="confirmation.text"
      :symbol="confirmation.symbol"
      :tone="confirmation.tone"
      :stats="confirmation.stats"
      :close-label="txt('cancel')"
      @closed="onConfirmClosed"
    >
      <template #actions>
        <UiButton tone="neutral" @click="confirmOpen = false">{{ txt('cancel') }}</UiButton>
        <UiButton :tone="confirmation.tone" @click="confirmChosen">{{ confirmation.label }}</UiButton>
      </template>
    </RunnerWindow>

    <!-- Mientras se prepara lo primero que se va a ver, solo el suelo del escenario; si tarda, la carga del kit. -->
    <div v-if="!loaded" class="player-loading" aria-hidden="true"><UiSpinner /></div>

    <div ref="probe" class="safe-probe" aria-hidden="true" />
  </main>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import type { RunnerMode, StoryboardGuide } from '@playhub/ui/app/utils/runner-contract'
import type { UiIconName } from '@playhub/ui/app/utils/ui-icons'
import type { UiTone } from '@playhub/ui/app/utils/ui-tones'
import { cancelNarration, narrate, NARRATOR_KEY } from './audio/narration'
import { textoDe, vozDe } from './audio/voz'
import type { Parte, Voz } from './audio/voz'
import { muted, setMuted } from './audio/settings'
import { itemsOf, librarySvg } from './content'
import { cueInterface, cueSound, SCALE } from './engine/sound'
import { useRunnerText } from './i18n'
import { forgetMemory, memoryKey, openingScene, readMemory, urlWithScene, writeMemory } from './memory'
import type { MemoryStore } from './memory'
import { decodeImage, fontsReady, isPreloaded, mark, preloadScene, within } from './preload'
import { profileOf } from './profiles'
import PerfilPieza from './PerfilPieza.vue'
import { AVATARES, dibujoDe, nombreVisible, nombresSinRepetir, tonoDe } from '@playhub/ui/app/utils/avatares'
import type { Avatar, TonoAvatar } from '@playhub/ui/app/utils/avatares'
import { canalDemostracion } from './conexion/demo'
import { RITMO, leerMensaje } from './conexion/mensajes'
import type { CanalSesion, MensajeSesion } from './conexion/mensajes'
import { estanAhora, olvidarParticipante, origenParaUnirse, participanteGuardado } from './conexion/participante'
import { urlsDelRunner } from './urlsDeLasApps'
import RunnerDevices from './RunnerDevices.vue'
import type { DeviceView } from './RunnerDevices.vue'
import RunnerGuide from './RunnerGuide.vue'
import RunnerWindow from './RunnerWindow.vue'
import { TEMPLATES } from './templates'
import type { FeedbackPayload, LoadedStoryboard, RunnerScene } from './types'
import { useFrameFit } from './useFrameFit'
import { SCENE_HOLD_KEY, useSceneLoad } from './useSceneLoad'
import { replay } from './useTimers'

const props = defineProps<{
  storyboard: LoadedStoryboard
  mode: RunnerMode
  locale: string
  /** Carpeta de la escena con la que abre (?escena=). */
  start?: string
  /** La guía por carpeta de escena, que da la app que incrusta el runner (docs/runner.md). */
  guide?: StoryboardGuide | null
  /** Dentro de otra app: terminar y salir se le cuentan a ella en vez de navegar aquí. */
  embedded?: boolean
  /** La conexión del taller (tarea 013): el código y, en la pantalla del educador, la llave. Sin ella, la sesión es
   *  la de demostración, entre pestañas del mismo navegador. */
  conexion?: { codigo: string, llave?: string } | null
  /** `?mode=rehearsal`, el ensayo del educador (Educators, «Ensayar»): la consola del educador y la guía, sin
   *  dispositivos ni sesión, y con su propia memoria, que no se mezcla con la del taller de verdad. */
  rehearsal?: boolean
  /** En casa, desde la app del hogar (tarea 025): el perfil con que se juega (un identificador del dispositivo, para
   *  recordar dónde iba), su avatar y su nombre (llega con `iniciar`), y si la app se abrió instalada. */
  perfil?: string
  avatar?: Avatar
  nombre?: string
  instalada?: boolean
}>()

const emit = defineEmits<{
  /** Lo primero que se ve ya está completo en pantalla. */
  ready: []
  scene: [index: number, folder: string]
  finish: []
  exit: [index: number, folder: string]
}>()

const txt = useRunnerText(() => props.locale)
const text = (value: Parte) => textoDe(value, props.locale)
const uid = useId()
const router = useRouter()

const scenes = props.storyboard.scenes
const profile = profileOf(props.storyboard.json.audience)
const isGame = (scene: RunnerScene) => scene.json.template !== 'anuncio'
// Quien conduce desde la consola: el educador y la persona en casa (la vista previa la conduce su app).
const leads = props.mode === 'educator' || props.mode === 'home'
// La narración del storyboard en su idioma. En casa suena sola: la introducción de cada escena al verse y cada hoja
// al abrirse, porque no hay un educador que lo diga. En el taller la dice el educador; «Escuchar» sirve en todos.
const narrationContext = { category: props.storyboard.category, storyboardId: props.storyboard.json.slug, locale: props.locale }
const narrates = props.mode === 'home'
// En casa, el niño: su apodo y su avatar, un animal del kit (`dibujoDe`) en un círculo. Cada animal lleva
// el tono de fondo que mejor lo separa de su pelaje, entre los tonos del kit para las personas (cielo, uva o rosa).
// El runner no conoce al niño: se lo da la app del hogar (el perfil y su avatar en la URL, su nombre con `iniciar`);
// abierto directamente, es este de demostración. El tono y el nombre propio de cada animal están en avatares.ts (del
// kit): los mismos al unirse a un taller.
const AVATAR_TONES = Object.fromEntries(AVATARES.map(a => [a.clave, a.tono])) as Record<Avatar, TonoAvatar>
const player = reactive<{ apodo: string, avatar: Avatar }>({
  apodo: props.nombre || (props.avatar ? nombreVisible(null, props.avatar) : 'Jeffrey'),
  avatar: props.avatar ?? 'zorro',
})
watch(() => props.nombre, (nombre) => { if (nombre) player.apodo = nombre })

// ── Estado por escena ──────────────────────────────────────────────────────────
type FeedbackType = 'success' | 'info' | 'retry'
interface Message { type: FeedbackType, title: string, body?: string, voice: Voz, sequence: number }
interface SceneState {
  visited: boolean
  /** Montada por adelantado, sin haberse visto todavía. */
  warm: boolean
  generation: number
  fraction: number
  completed: boolean
  /** Ya celebró (las chispas) en esta partida: una vez cada vez que se juega, aunque el aparato ya la tuviera hecha. */
  celebrated: boolean
  /** Su cierre, si la plantilla lo dio (`closing`): sustituye a la consigna en el pie. */
  closing: { title: string, body?: string, voice: Voz } | null
  message: Message | null
}

const states = reactive<SceneState[]>(scenes.map(() => ({
  visited: false, warm: false, generation: 0, fraction: 0, completed: false, celebrated: false, closing: null, message: null,
})))

// ── Lo que recuerda el aparato (memory.ts): recargar la página no devuelve el taller al principio. Guarda en qué
// escena iba y cuáles estaban hechas: en el taller, mientras dure la pestaña del educador; en casa, por perfil del
// niño, en el dispositivo. Un dispositivo sigue a la sesión y la vista previa, a su app: no recuerdan nada. Al volver,
// la escena empieza desde su principio y las hechas conservan su marca. Al terminar el taller, se olvida.
function storeFor(mode: RunnerMode): MemoryStore | null {
  if (!import.meta.client) return null
  try {
    if (mode === 'educator') return window.sessionStorage
    if (mode === 'home') return window.localStorage
  }
  catch { /* el navegador no deja guardar: sin memoria */ }
  return null
}
const memoryStore = storeFor(props.mode)
const memory = memoryKey(props.storyboard.json.key, props.rehearsal ? 'rehearsal' : props.mode, props.mode === 'home' ? (props.perfil ?? `${player.avatar}-${player.apodo}`) : undefined)
const remembered = readMemory(memoryStore, memory)
for (const folder of remembered?.done ?? []) {
  const i = scenes.findIndex(scene => scene.folder === folder)
  if (i >= 0) Object.assign(states[i]!, { completed: true, fraction: 1 })
}
// Abierto directamente, la dirección lleva la escena actual (?escena=): recargar abre en ella. Dentro de otra app, la
// dirección es de ella y basta con la memoria.
function remember() {
  if (!memoryStore) return
  const folder = scenes[current.value]!.folder
  writeMemory(memoryStore, memory, { scene: folder, done: scenes.filter((_, i) => states[i]!.fraction >= 1).map(scene => scene.folder) })
  if (!props.embedded) {
    try { window.history.replaceState(window.history.state, '', urlWithScene(window.location.href, folder)) }
    catch { /* la dirección se queda como estaba */ }
  }
}

// ── Carga: nada aparece a medias. Lo primero que se ve se prepara antes de enseñar el marco (la letra, los dibujos
// de la escena y su Rive, en preload.ts) y entonces aparece entero, de una vez. Cada escena se muestra cuando sus
// personajes ya están pintados (useSceneLoad), y la que viene se monta por adelantado para que «Siguiente» la
// encuentre completa.
const loaded = ref(false)
// Solo en el momento de aparecer: el marco entra con un fundido corto.
const entering = ref(false)
const sceneLoad = useSceneLoad(scenes.length)
provide(SCENE_HOLD_KEY, (el: Element) => {
  const index = Number((el.closest('[data-scene]') as HTMLElement | null)?.dataset.scene ?? -1)
  return sceneLoad.hold(index)
})

/** Monta una escena: la que se va a ver o, con `warm`, la siguiente por adelantado. */
function mountScene(i: number, warm = false) {
  const state = states[i]
  if (!state) return
  const mounted = state.visited || state.warm
  if (warm) state.warm = true
  else state.visited = true
  if (mounted) return
  sceneLoad.open(i)
  nextTick(() => sceneLoad.settle(i))
}

// Empieza ya en la escena pedida (?escena=) o en la que recuerda, para que el avance y el título no muestren la primera
// un instante.
const current = ref(props.mode === 'device' ? 0 : openingScene(scenes.map(scene => scene.folder), props.start, remembered))
// La escena con la que vuelve empieza desde su principio: no cuenta como hecha hasta jugarla otra vez.
if (remembered) Object.assign(states[current.value]!, { completed: false, fraction: 0 })
const active = computed(() => scenes[current.value]!)
const activeState = computed(() => states[current.value]!)
const isLast = computed(() => current.value === scenes.length - 1)
const nextLabel = computed(() => (isLast.value ? txt('finish') : txt('next')))
/** El cierre de la escena actual (`closing`), en lugar de su consigna. */
const closing = computed(() => activeState.value.closing)
/** La última escena ya está hecha: Terminar se activa, en lima, porque es lo que sigue. */
const finishReady = computed(() => isLast.value && activeState.value.completed)
// En casa se pasa a la siguiente escena cuando el juego de esta está hecho; una escena sin juego (la Bienvenida) deja
// pasar siempre. El educador conduce: pasa cuando quiere.
const canAdvance = computed(() => props.mode !== 'home' || !isGame(active.value) || activeState.value.completed)
// La escena que viene, para el nombre accesible de Siguiente.
const upcoming = computed(() => scenes[current.value + 1] ?? null)
const percent = computed(() => Math.round(states.reduce((sum, s) => sum + s.fraction, 0) / scenes.length * 100))

const instances = new Map<number, { fit?: () => void }>()
function setInstance(i: number, el: { fit?: () => void } | null) {
  if (el) instances.set(i, el)
  else instances.delete(i)
}

const customComponents = new Map<string, Component>()
function sceneComponent(scene: RunnerScene): Component {
  if (scene.json.template) return TEMPLATES[scene.json.template]
  let comp = customComponents.get(scene.folder)
  if (!comp && scene.custom) {
    comp = defineAsyncComponent(scene.custom)
    customComponents.set(scene.folder, comp)
  }
  return comp ?? TEMPLATES.anuncio
}

function templateProps(scene: RunnerScene, i: number) {
  return {
    scene: scene.json,
    items: itemsOf(props.storyboard, scene.json.defaults.items),
    profile,
    locale: props.locale,
    blocked: i !== current.value || blocked.value,
    storyboard: props.storyboard,
  }
}

// ── Pausas: una pausa o un panel abierto congelan el tablero; en un dispositivo, también la sesión.
const pauseReasons = reactive(new Set<string>())
const manualPause = computed(() => pauseReasons.has('manual'))
const guideOpen = ref(false)
const scenesOpen = ref(false)
const railOpen = ref(false)
const devicesOpen = ref(false)
const confirmOpen = ref(false)

// Lo que sabe el dispositivo del taller: solo las órdenes de la sesión.
const session = reactive({ open: false, closed: false, removed: false, left: false, scene: null as string | null, paused: false, held: false })
// Un número en poco sitio (el botón de Dispositivos): hasta 99; más, «99+».
const cifraCorta = (n: number) => (n > 99 ? '99+' : String(n))
// El taller en vivo tiene dispositivos (su panel, en la barra); el ensayo y casa, no.
const withDevices = computed(() => props.mode === 'educator' && !props.rehearsal)
// Educador: los dispositivos en pausa desde su panel, sin detener su pantalla (`pauseAllDevices`).
const dispositivosEnPausa = ref(false)
const finished = ref(false)

const blocked = computed(() => {
  if (pauseReasons.size) return true
  return props.mode === 'device' && (!session.open || session.paused || session.held)
})

function setPause(reason: string, value: boolean) {
  if (value) pauseReasons.add(reason)
  else pauseReasons.delete(reason)
  if (reason === 'manual') publish()
}

const resume = () => setPause('manual', false)

// La pausa del riel de Ajustes lo cierra primero.
function fromRail(action: () => void) {
  setRail(false)
  action()
}

interface OverlayLook {
  icon: UiIconName
  tone: UiTone
  title: string
  /** De qué escena o taller se trata; en el dispositivo, nada: lo usa un niño (Luis, 2026-11-26). */
  caption?: string
  text?: string
  /** El teléfono en vertical: una pantalla entera para girarlo, no una ventana (`rotate-screen`). */
  rotate?: boolean
  /** La pausa del educador: cerrar y «Continuar». */
  action?: boolean
  /** Otra acción de la ventana (entrar en pantalla completa, volver a entrar al taller). */
  cta?: { label: string, icon: UiIconName, run: () => void }
}
const sceneCaption = () => txt('sceneCaption', { n: current.value + 1, total: scenes.length, name: active.value.title })
const workshopCaption = () => txt('workshopCaption', { title: text(props.storyboard.json.title) })

// Un teléfono en vertical (su lado corto, de menos de 600): el dispositivo pide girarlo.
const phonePortrait = ref(false)
let portraitQuery: MediaQueryList | null = null
const onPortrait = () => { phonePortrait.value = portraitQuery?.matches ?? false }
onMounted(() => {
  portraitQuery = matchMedia('(orientation: portrait) and (max-width: 599px)')
  onPortrait()
  portraitQuery.addEventListener('change', onPortrait)
})
onUnmounted(() => portraitQuery?.removeEventListener('change', onPortrait))

const overlay = computed<OverlayLook | null>(() => {
  if (finished.value || (props.mode === 'device' && session.closed && !session.removed)) {
    // En un dispositivo, las ventanas son un icono y un título: sin texto, que un niño que no lee no necesita (Luis,
    // 2026-11-26), ni siquiera en la demostración.
    return props.mode === 'device'
      ? { icon: 'check', tone: 'lime', title: txt('closedTitle') }
      : { icon: 'check', tone: 'lime', title: txt('closedTitle'), caption: workshopCaption(), text: txt('closedText') }
  }
  if (props.mode === 'device') {
    // Quitado o fuera del taller. Con la conexión del taller no hay ventana: va a la página inicial (`cerrarDelTodo`) y,
    // mientras llega, el tablero se queda quieto. En la demostración, la ventana.
    if (session.removed) return props.conexion ? null : { icon: 'devices', tone: 'sky', title: txt('removedTitle') }
    if (session.left) {
      return props.conexion ? null : { icon: 'exit', tone: 'sky', title: txt('leftTitle'), cta: { label: txt('rejoin'), icon: 'play', run: rejoin } }
    }
    // El tablero es horizontal (una sola composición): en un teléfono en vertical se pide girarlo, con una pantalla
    // entera pensada para un niño: el teléfono que gira, «Gira el teléfono» y, donde el navegador permite pantalla
    // completa, «Jugar», que entra en ella y la deja en horizontal (Luis, 2026-11-26: la ventana con su texto y su botón
    // enorme no servía para niños).
    if (phonePortrait.value) {
      return {
        rotate: true,
        icon: 'smartphone',
        tone: 'sky',
        title: txt('rotateTitle'),
        ...(canFullscreen.value ? { cta: { label: txt('playFullscreen'), icon: 'play' as const, run: () => void toggleFullscreen() } } : {}),
      }
    }
    if (!session.open) return { icon: 'devices', tone: 'sky', title: txt('waitingTitle') }
    if (session.paused || session.held) return { icon: 'pause', tone: 'sky', title: txt('pausedTitle') }
    return null
  }
  if (manualPause.value && !guideOpen.value && !devicesOpen.value && !confirmOpen.value) {
    return { icon: 'pause', tone: 'sky', title: txt('pausedTitle'), caption: sceneCaption(), text: txt('pausedEducator'), action: props.mode === 'educator' }
  }
  return null
})

const overlayAction = ref<{ $el?: HTMLElement } | null>(null)
watch(() => overlay.value?.action || Boolean(overlay.value?.cta), (action) => {
  if (action) nextTick(() => (overlayAction.value?.$el as HTMLElement | undefined)?.focus({ preventScroll: true }))
})

// ── Consigna y feedback ───────────────────────────────────────────────────────
// La consigna de todo juego que la trae va abajo a la izquierda, siempre a la vista; la Bienvenida no la muestra (es la
// frase que suena al tocar su tarjeta).
const showsConsigna = (scene: RunnerScene) => isGame(scene) && Boolean(text(scene.json.meta.instruction))
const hasInstruction = computed(() => showsConsigna(active.value) && !(props.mode === 'device' && !session.open))
// Lo que se dice al presentar una escena: su consigna con su voz (audio/voz.ts). En la Bienvenida no se ve, pero suena.
const introOf = (scene: RunnerScene): Voz => vozDe([scene.json.meta.instruction], props.locale)

const LOOKS: Record<FeedbackType, { tone: UiTone, icon: UiIconName }> = {
  success: { tone: 'lime', icon: 'check-circle' },
  info: { tone: 'sky', icon: 'info' },
  retry: { tone: 'sun', icon: 'retry' },
}
const typeOf = (kind: FeedbackPayload['kind']): FeedbackType =>
  kind === 'success' || kind === 'complete' ? 'success' : kind === 'retry' ? 'retry' : 'info'

// En un dispositivo no sube hoja (Luis, 2026-11-26): el educador ya mostró el juego con su feedback en la pantalla
// principal, sin voz un texto no le sirve a quien no sabe leer y en un teléfono tapa el tablero. Ahí la respuesta es la del
// juego: su sonido (el acierto con su racha, el «otra vez»), las piezas, el personaje y las chispas al completarlo.
const message = computed(() => (props.mode === 'device' ? null : activeState.value.message))
// Al cerrarse, la hoja baja con el tono que tenía.
const lastType = ref<FeedbackType>('success')
watch(() => message.value?.type, (type) => { if (type) lastType.value = type })
const look = computed(() => LOOKS[message.value?.type ?? lastType.value])
const feedbackType = computed(() => message.value?.type ?? 'none')
const feedbackEl = ref<HTMLElement | null>(null)
let sequence = 0

watch(() => message.value?.sequence, (seq) => {
  if (!seq || !message.value) return
  announce([message.value.title, message.value.body].filter(Boolean).join('. '))
  replay(feedbackEl.value, 'is-entering')
})

const nextButton = ref<{ $el?: HTMLElement } | null>(null)
const stage = ref<HTMLElement | null>(null)

function closeFeedback(focus = true) {
  activeState.value.message = null
  if (!focus) return
  // El foco vuelve a Siguiente; si todavía no se puede pasar (en casa, con el juego a medias), al escenario.
  const target = leads && canAdvance.value ? (nextButton.value?.$el as HTMLElement | undefined) : stage.value
  target?.focus({ preventScroll: true })
}

const announcement = ref('')
function announce(value: string) {
  announcement.value = value
}

// ── Eventos de una plantilla. La plantilla nunca sabe el modo: el marco decide qué significan.
function onProgress(i: number, value: number) {
  const state = states[i]!
  state.fraction = state.completed ? 1 : value
}

// Chispas: una ráfaga cada vez que se completa un juego, en los tonos de las piezas y el lima. También si el aparato ya lo
// tenía hecho de antes (la memoria): quien lo juega otra vez lo termina otra vez (Luis, 2026-11-20, en la Despedida).
const SPARKS = 22
const SPARK_TONES = ['sun', 'coral', 'sky', 'grape', 'rose', 'lime'] as const
const burst = ref(0)
let burstTimer: ReturnType<typeof setTimeout> | undefined
function sparkStyle(n: number) {
  const angle = (n / SPARKS) * Math.PI * 2 + ((n * 37) % 11) / 20
  const reach = 300 + ((n * 53) % 7) * 34
  return {
    '--dx': `${Math.round(Math.cos(angle) * reach * 1.4)}px`,
    '--dy': `${Math.round(Math.sin(angle) * reach * 0.6 + 140)}px`,
    '--r': `${((n * 97) % 360) - 180}deg`,
    '--delay': `${(n % 5) * 30}ms`,
  }
}

const sceneCard = ref<HTMLElement | null>(null)

function onComplete(i: number) {
  const state = states[i]!
  if (!state.celebrated && i === current.value) {
    state.celebrated = true
    burst.value += 1
    clearTimeout(burstTimer)
    burstTimer = setTimeout(() => { burst.value = 0 }, 1600)
    replay(sceneCard.value, 'is-advancing')
    cueSound('completar')
  }
  state.completed = true
  state.fraction = 1
  publish()
  remember()
}

// La hoja llega con su sonido: un acierto, un «otra vez» o un aviso. Si además completa la escena, suena solo eso.
// La racha se oye: cada acierto seguido en la escena suena un paso más arriba en la escala; un «otra vez» la corta.
const FEEDBACK_SOUNDS = { success: 'acierto', retry: 'reintento', info: 'aviso' } as const
let streak = 0
function onFeedback(i: number, payload: FeedbackPayload) {
  // Sin voz propia (una escena con su `scene.vue`), la hoja se lee como se ve.
  const voice = payload.voice ?? vozDe([payload.title, payload.body], props.locale)
  // El cierre de la última escena no sube hoja: ocupa el lugar de la consigna y, en casa, se dice solo. Su sonido es el de
  // completar la escena, que ya suena.
  if (payload.kind === 'closing') {
    states[i]!.closing = { title: payload.title, body: payload.body, voice }
    if (i === current.value && narrates) listen(voice)
    return
  }
  const type = typeOf(payload.kind)
  states[i]!.message = { type, title: payload.title, body: payload.body, voice, sequence: ++sequence }
  if (i !== current.value) return
  // En casa, la hoja se dice sola al abrirse (corta lo que estuviera sonando).
  if (narrates) listen(voice)
  if (type === 'retry') streak = 0
  cueSound(FEEDBACK_SOUNDS[type], type === 'success' ? { rate: SCALE[Math.min(streak, SCALE.length - 1)] } : undefined)
  if (type === 'success') streak += 1
}

// ── Navegación (educador y casa; en la vista previa, con las teclas). Un dispositivo solo sigue a la sesión.
// Ir a una escena que todavía no está lista (un salto desde la lista, nada más abrir) espera un momento a sus dibujos
// para enseñarla entera; la última petición manda.
let going = 0
function goTo(index: number, focus = true) {
  const scene = scenes[index]
  if (!scene) return
  const turn = ++going
  if (loaded.value && !states[index]!.visited && !states[index]!.warm && !isPreloaded(scene)) {
    void within(2000, preloadScene(scene)).then(() => {
      if (turn === going && !unmounted) show(index, focus)
    })
    return
  }
  show(index, focus)
}

// En casa, la introducción de la escena suena cuando la escena ya se ve, si sigue siendo la actual y nada la tapa.
function narrateIntro(index: number) {
  if (!narrates) return
  void sceneLoad.whenShown(index).then(() => {
    if (unmounted || current.value !== index || blocked.value) return
    listen(introOf(scenes[index]!))
  })
}

// En el taller en vivo, cada escena que no es la primera ni la última empieza con los dispositivos en pausa (Luis,
// 2026-11-26: si no, los niños juegan sin esperar la explicación): primero explica el educador y después los libera,
// con el botón junto a Dispositivos o con «Liberar a Todos». La Bienvenida y la Despedida, libres. Solo al cambiar de
// escena (también al abrir el taller en una del medio): volver a mostrar la misma no vuelve a pausarlos.
let shownScene = -1
function show(index: number, focus: boolean) {
  if (withDevices.value && index !== shownScene) dispositivosEnPausa.value = index !== 0 && index !== scenes.length - 1
  shownScene = index
  cancelNarration()
  // Pasar a otra escena no suena. La racha de aciertos empieza de nuevo.
  streak = 0
  current.value = index
  pauseReasons.delete('manual')
  mountScene(index)
  burst.value = 0
  announce(txt('announceScene', { n: index + 1, name: active.value.title }))
  narrateIntro(index)
  // La primera escena se cuenta a la app al aparecer el marco, después de «listo» (start).
  if (props.mode !== 'device' && loaded.value) emit('scene', index, active.value.folder)
  nextTick(() => {
    instances.get(index)?.fit?.()
    if (focus && props.mode !== 'device') stage.value?.focus({ preventScroll: true })
  })
  publish()
  remember()
  warmNext()
}

// La escena que viene se monta por adelantado, oculta y en pausa: al pulsar «Siguiente» ya está completa.
function warmNext() {
  const index = current.value + 1
  const scene = scenes[index]
  if (!scene || !loaded.value || props.mode === 'device' || states[index]!.visited || states[index]!.warm) return
  void preloadScene(scene).then(() => {
    if (!unmounted && current.value + 1 === index) mountScene(index, true)
  })
}

function next() {
  if (!canAdvance.value) return // en casa, también con las teclas
  if (!isGame(active.value)) activeState.value.fraction = 1 // el Anuncio se cumple al presentarlo
  if (!isLast.value) {
    goTo(current.value + 1)
    return
  }
  if (props.mode === 'preview') return // en la vista previa no hay taller que terminar
  confirm({
    // El título, el verbo; la pregunta, en el texto (Luis, 2026-11-26).
    title: txt('finishTitle'),
    text: props.rehearsal ? txt('finishRehearsalText') : props.mode === 'home' ? txt('finishHome') : txt('finishText'),
    label: txt('finish'),
    symbol: 'check',
    tone: 'lime',
    action: terminar,
  })
}

const previous = () => goTo(current.value - 1)

function restartScene(i: number) {
  streak = 0 // la racha de aciertos empieza de nuevo
  // Su hoja se va con ella y, si se estaba oyendo, deja de sonar.
  if (i === current.value) cancelNarration()
  Object.assign(states[i]!, { message: null, closing: null, completed: false, celebrated: false, fraction: 0 })
  states[i]!.generation += 1
  remember()
  // Se monta de nuevo: vuelve a mostrarse cuando está completa.
  sceneLoad.open(i)
  nextTick(() => sceneLoad.settle(i))
}

// Salir a medias. Dentro de otra app, ella decide a dónde vuelve; el cierre queda debajo por si
// no responde. Abierto directamente, se vuelve atrás.
function leave() {
  post({ tipo: 'cierre' })
  cancelNarration()
  if (props.embedded) {
    emit('exit', current.value, active.value.folder)
    finished.value = true
  }
  else if (window.history.length > 1) router.back()
  else finished.value = true
}

// Terminar (la última escena): dentro de Educators, el educador sigue en el feedback del taller.
function terminar() {
  forgetMemory(memoryStore, memory)
  if (!props.embedded) return leave()
  post({ tipo: 'cierre' })
  cancelNarration()
  emit('finish')
  finished.value = true
}

function askExit() {
  confirm({
    title: txt('exitTitle'),
    text: props.rehearsal ? txt('exitRehearsalText') : props.mode === 'educator' ? txt('exitText') : txt('exitHome'),
    label: txt('exitAction'),
    symbol: 'exit',
    tone: 'coral',
    stats: [[txt('sceneStat'), txt('sceneStatValue', { n: current.value + 1, total: scenes.length })]],
    action: leave,
  })
}

function askRestart() {
  const i = current.value
  confirm({
    title: txt('restartTitle'),
    text: txt('restartText'),
    label: txt('restart'),
    symbol: 'retry',
    tone: 'sun',
    caption: sceneCaption(),
    action: () => {
      restartScene(i)
      publish()
    },
  })
}

// ── Confirmaciones ────────────────────────────────────────────────────────────
interface Confirmation {
  title: string
  text: string
  label: string
  symbol: UiIconName
  tone: UiTone
  caption?: string
  stats?: [string, string][]
  action?: () => void
}
const confirmation = reactive<Confirmation>({ title: '', text: '', label: '', symbol: 'info', tone: 'sun' })
let chosen: (() => void) | null = null

function confirm(options: Confirmation) {
  Object.assign(confirmation, { caption: workshopCaption(), stats: [], ...options })
  chosen = null
  confirmOpen.value = true
}

function confirmChosen() {
  chosen = confirmation.action ?? null
  confirmOpen.value = false
}

function onConfirmClosed() {
  const action = chosen
  chosen = null
  action?.()
}

watch(confirmOpen, open => setPause('dialog', open))

// ── Guía, escenas, ajustes y dispositivos (educador) ──────────────────────────
function setGuide(open: boolean) {
  guideOpen.value = open
  if (open) {
    if (devicesOpen.value) setDevices(false)
    if (railOpen.value) setRail(false)
    if (scenesOpen.value) setScenes(false)
  }
  setPause('guide', open)
}

function setScenes(open: boolean) {
  scenesOpen.value = open
  if (open) {
    if (railOpen.value) setRail(false)
    if (guideOpen.value) setGuide(false)
  }
  setPause('scenes', open)
}

// Cómo va cada escena en la lista: la actual manda sobre hecha.
type SceneListState = 'current' | 'done' | 'pending'
const SCENE_TONES: Record<SceneListState, UiTone> = { current: 'sun', done: 'lime', pending: 'neutral' }
const sceneState = (i: number): SceneListState => (i === current.value ? 'current' : states[i]!.fraction >= 1 ? 'done' : 'pending')

// Saltar a una escena desde la lista: cambiar de escena conserva su estado, como Anterior.
function jumpTo(index: number) {
  setScenes(false)
  if (index !== current.value) goTo(index)
}

function setRail(open: boolean) {
  railOpen.value = open
  if (open && scenesOpen.value) setScenes(false)
  if (!open && devicesOpen.value) setDevices(false)
  setPause('rail', open)
}

function setDevices(open: boolean) {
  devicesOpen.value = open
  if (open && guideOpen.value) setGuide(false)
  if (!open) selectedDevice.value = null
  setPause('devices', open)
}

// Un toque fuera de la lista o del riel los cierra (Ajustes sigue abierto mientras Dispositivos lo está).
function onPointerDown(event: PointerEvent) {
  const target = event.target as HTMLElement
  if (scenesOpen.value && !target.closest('.scene-list, .scenes-button')) setScenes(false)
  if (railOpen.value && !devicesOpen.value && !target.closest('.quick-rail, .settings-button')) setRail(false)
}

function toggleMute() {
  setMuted(!muted.value)
  if (muted.value) cancelNarration()
}

// Pantalla completa solo donde el navegador la permite (no en iPhone) y siempre tras un toque: ningún navegador deja
// entrar sola a una página. Al entrar, el aparato se queda en horizontal donde se puede fijar (Android); al salir de
// pantalla completa, se suelta solo. El estado se lee al montar, no solo al cambiar: si el marco se monta con la página ya
// en pantalla completa (llega desde otra página, o se vuelve a montar), el botón lo sabe (Luis, 2026-11-26). Con los
// nombres con prefijo de algunos navegadores de móvil. Una app instalada que ya abre a pantalla completa no lo ofrece: se
// reconoce porque está en `display-mode: fullscreen` sin estar en la pantalla completa de la página (Chrome en Android
// también marca ese modo cuando la página entra en pantalla completa: por sí solo escondía el botón).
type DocumentoConPrefijo = Document & { webkitFullscreenElement?: Element | null, webkitFullscreenEnabled?: boolean, webkitExitFullscreen?: () => Promise<void> }
type RaizConPrefijo = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> }
const doc = () => document as DocumentoConPrefijo
const elementoEnPantallaCompleta = () => document.fullscreenElement ?? doc().webkitFullscreenElement ?? null
const appEnPantallaCompleta = () => matchMedia('(display-mode: fullscreen)').matches && !elementoEnPantallaCompleta()
const canFullscreen = ref(false)
// La app del hogar instalada ya se abre sin las barras del navegador: ahí la pantalla completa no aporta (Luis, 2026-11-27).
watch(() => props.instalada, (instalada) => { if (instalada) canFullscreen.value = false })
const fullscreen = ref(false)
async function toggleFullscreen() {
  try {
    if (elementoEnPantallaCompleta()) {
      await (document.exitFullscreen ? document.exitFullscreen() : doc().webkitExitFullscreen?.())
      return
    }
    const raiz = document.documentElement as RaizConPrefijo
    await (raiz.requestFullscreen ? raiz.requestFullscreen() : raiz.webkitRequestFullscreen?.())
    const orientation = screen.orientation as ScreenOrientation & { lock?: (orientation: string) => Promise<void> }
    await orientation.lock?.('landscape').catch(() => {})
  }
  catch {
    announce(txt('fullscreenUnsupported'))
  }
}
const onFullscreen = () => { fullscreen.value = Boolean(elementoEnPantallaCompleta()) }

function listen(voz: Voz) {
  void narrate(narrationContext, voz)
}
// Las escenas narran por aquí (la Bienvenida, al tocar a sus protagonistas), con la voz del storyboard.
provide(NARRATOR_KEY, (voz, onState) => narrate(narrationContext, voz, onState))

// ── Sesión del taller ─────────────────────────────────────────────────────────
// Con la conexión del taller (tarea 013), por Realtime de Supabase (conexion/realtime.ts): los dispositivos entran
// con el QR o el código y el educador los aprueba. Sin ella, la demostración entre pestañas del mismo navegador, con
// seis dispositivos de prueba. Los mensajes (conexion/mensajes.ts) son los mismos en los dos casos.
type SessionMessage = MensajeSesion

let channel: CanalSesion | null = null
const post = (msg: SessionMessage) => channel?.postMessage(msg)

// Educador → dispositivos: escena, pausa y reinicios. Nada más.
function publish() {
  if (props.mode !== 'educator') return
  post({
    tipo: 'estado',
    escena: active.value.folder,
    pausa: manualPause.value,
    pausaDispositivos: dispositivosEnPausa.value,
    reinicios: Object.fromEntries(scenes.map((s, i) => [s.folder, states[i]!.generation])),
  })
}

interface Device { id: string, nombre: string, tono: DeviceView['tono'], avatar?: string, prueba?: boolean, pausado: boolean, escena?: string | null, seen?: number, note?: string }

// Seis dispositivos de prueba, uno por avatar: siguen la sesión y obedecen aquí mismo, para probar el panel sin
// abrir pestañas. Una pestaña con ?mode=device se suma de verdad y va primero en la lista. Con la conexión del taller
// no hay dispositivos de prueba: solo los que entraron.
const devices = reactive(new Map<string, Device>(props.mode === 'educator' && !props.conexion && !props.rehearsal
  ? AVATARES.map((a, i) => [`prueba-${i + 1}`, { id: `prueba-${i + 1}`, nombre: a.nombre, tono: a.tono, avatar: a.clave, prueba: true, pausado: false }])
  : []))
const selectedDevice = ref<string | null>(null)

const sceneOfDevice = (device: Device) => (device.prueba ? current.value : scenes.findIndex(s => s.folder === device.escena))

const deviceViews = computed<DeviceView[]>(() => [...devices.values()]
  .sort((a, b) => Number(Boolean(a.prueba)) - Number(Boolean(b.prueba)))
  .map((device) => {
    const at = sceneOfDevice(device)
    const where = scenes[at]
    const pausado = device.pausado || dispositivosEnPausa.value
    const status = device.note || (pausado
      ? txt('devicePaused')
      : where ? txt('deviceAt', { n: at + 1, name: where.title }) : txt('deviceWaiting'))
    return { id: device.id, nombre: nombres.value.get(device.id) ?? device.nombre, tono: device.tono, avatar: device.avatar, pausado, status }
  }))

let noteTimer: ReturnType<typeof setTimeout> | undefined
function noteDevice(device: Device, note: string) {
  clearTimeout(noteTimer)
  device.note = note
  noteTimer = setTimeout(() => { device.note = '' }, 2000)
}

const order = (device: Device, accion: 'pausa' | 'libera' | 'reinicio' | 'quitar') => {
  if (!device.prueba) post({ tipo: 'orden', id: device.id, accion })
}

// Pausar solo los dispositivos, desde su panel (Luis, 2026-11-26): la pausa de Ajustes detiene el taller entero, también
// la pantalla del educador; esta, solo los teléfonos, para que miren y escuchen mientras el educador sigue. Va en el
// estado que reciben todos (`dispositivosEnPausa`, junto a la sesión), así que también queda en pausa quien entra
// después. Liberar a todos libera también a los pausados uno por uno.
function pauseAllDevices() {
  dispositivosEnPausa.value = !dispositivosEnPausa.value
  if (!dispositivosEnPausa.value) {
    devices.forEach((device) => {
      if (!device.pausado) return
      device.pausado = false
      order(device, 'libera')
    })
  }
  publish()
}

// Reiniciar la escena solo en los dispositivos, desde su panel (Luis, 2026-11-26), como «Pausar a Todos»: el Reiniciar
// de la barra la reinicia también en la pantalla del educador. A cada conectado, la misma orden que a uno; pide
// confirmación, como aquel.
function askRestartAllDevices() {
  confirm({
    title: txt('restartAllTitle'),
    text: txt('restartAllText'),
    label: txt('restart'),
    symbol: 'retry',
    tone: 'sun',
    action: () => devices.forEach(device => order(device, 'reinicio')),
  })
}

function pauseDevice() {
  const device = selectedDevice.value ? devices.get(selectedDevice.value) : undefined
  if (!device || dispositivosEnPausa.value) return
  device.pausado = !device.pausado
  order(device, device.pausado ? 'pausa' : 'libera')
  noteDevice(device, device.pausado ? txt('devicePaused') : txt('deviceFreed'))
}

function restartDevice() {
  const device = selectedDevice.value ? devices.get(selectedDevice.value) : undefined
  if (!device) return
  order(device, 'reinicio')
  const at = sceneOfDevice(device)
  noteDevice(device, at >= 0 ? txt('deviceRestarted', { n: at + 1 }) : txt('deviceRestartedPlain'))
}

function askRemoveDevice() {
  const device = selectedDevice.value ? devices.get(selectedDevice.value) : undefined
  if (!device) return
  confirm({
    title: txt('removeTitle'),
    text: txt('removeText', { name: device.nombre }),
    label: txt('remove'),
    symbol: 'close',
    tone: 'coral',
    action: () => {
      devices.delete(device.id)
      selectedDevice.value = null
      // Primero en la base y después la orden: el dispositivo va a su página para unirse y lee ahí que lo quitaron.
      if (!conexionApi) return order(device, 'quitar')
      void conexionApi.rechazar(device.id).catch(() => {}).finally(() => {
        order(device, 'quitar')
        void refrescarSolicitudes()
      })
    },
  })
}

// Dispositivo: quién es. Con la conexión del taller, el avatar y el apodo que eligió al unirse (/workshop/join), con el
// identificador de ese dispositivo para esa conexión. En la demostración, uno de los animales al azar para esta pestaña.
type Identity = { id: string, nombre: string, tono: TonoAvatar, avatar: Avatar }
function deviceIdentity(): Identity | null {
  if (props.conexion) {
    const p = participanteGuardado(props.conexion.codigo)
    return p ? { id: p.dispositivo, nombre: nombreVisible(p.apodo, p.avatar), tono: tonoDe(p.avatar), avatar: p.avatar } : null
  }
  try {
    const saved = JSON.parse(sessionStorage.getItem('playhub-dispositivo') ?? 'null')
    if (saved?.id && saved.avatar in AVATAR_TONES) return saved
  }
  catch { /* sin almacenamiento */ }
  const a = AVATARES[Math.floor(Math.random() * AVATARES.length)]!
  const identity: Identity = { id: Math.random().toString(36).slice(2, 10), nombre: a.nombre, tono: a.tono, avatar: a.clave }
  try { sessionStorage.setItem('playhub-dispositivo', JSON.stringify(identity)) }
  catch { /* sin almacenamiento */ }
  return identity
}
const me = ref<Identity | null>(null)

function presence() {
  if (!me.value) return
  post({ tipo: 'presencia', ...me.value, escena: session.open ? active.value.folder : null, pausado: session.held })
}
// La señal de cada pocos segundos. Mientras no le haya llegado la escena, también vuelve a saludar: si algo se perdió,
// el educador la manda otra vez y nadie se queda esperando.
function latido() {
  if (!session.open && !session.closed && !session.removed && !session.left) post({ tipo: 'hola' })
  presence()
}

// Los reinicios del educador que este dispositivo ya vio, por escena. Aparte de su propio contador (`generation`, que
// también sube cuando lo reinicia una orden): antes se comparaban los dos, y tras reiniciar a uno (o a todos, desde el
// panel) el siguiente estado lo volvía a reiniciar y le borraba lo jugado; y un reinicio del educador que coincidiera con
// ese contador no llegaba (2026-11-26). El primer estado solo anota: la escena acaba de montarse.
const restartsSeen = new Map<string, number>()
function applyState(state: Extract<SessionMessage, { tipo: 'estado' }>) {
  if (session.removed) return
  session.closed = false
  session.open = true
  session.paused = state.pausa || Boolean(state.pausaDispositivos)
  scenes.forEach((scene, i) => {
    const generation = state.reinicios?.[scene.folder] ?? 0
    const seen = restartsSeen.get(scene.folder)
    restartsSeen.set(scene.folder, generation)
    if (seen !== undefined && generation !== seen) restartScene(i)
  })
  const index = scenes.findIndex(s => s.folder === state.escena)
  if (index >= 0 && (index !== current.value || !session.scene)) {
    session.scene = state.escena
    goTo(index, false)
  }
}

let presenceTimer: ReturnType<typeof setInterval> | undefined

// Salir, en un dispositivo: lo saca solo a él (se despide y deja de dar señales); el taller sigue. Dentro de una app (la
// del hogar), la app sabe adónde volver (`salir`); con la conexión del taller, a la página del código; en la
// demostración, queda la ventana para volver a entrar.
function askLeave() {
  confirm({
    title: txt('leaveTitle'),
    // Al niño, el verbo y la pregunta, sin de qué taller se trata.
    text: txt('leaveText'),
    caption: '',
    label: txt('exitAction'),
    symbol: 'exit',
    tone: 'coral',
    action: leaveWorkshop,
  })
}
function leaveWorkshop() {
  cancelNarration()
  clearInterval(presenceTimer)
  if (me.value) post({ tipo: 'adios', id: me.value.id })
  Object.assign(session, { left: true, open: false, held: false })
  if (elementoEnPantallaCompleta()) void (document.exitFullscreen ? document.exitFullscreen() : doc().webkitExitFullscreen?.())?.catch(() => {})
  if (props.embedded) emit('exit', current.value, active.value.folder)
  else cerrarDelTodo()
}
// Con la conexión del taller, salir o ser quitado cierra la sesión del todo (Luis, 2026-11-26): el dispositivo lo olvida
// y va a la página inicial, `/workshop/join`, sin una ventana ni una página para volver a entrar. Si escribe el código
// otra vez, elige avatar y nombre y lo solicita como la primera vez.
function cerrarDelTodo() {
  if (!props.conexion) return
  olvidarParticipante(props.conexion.codigo)
  if (elementoEnPantallaCompleta()) void (document.exitFullscreen ? document.exitFullscreen() : doc().webkitExitFullscreen?.())?.catch(() => {})
  // Dentro de la app del hogar (tarea 025), ella decide a dónde volver.
  if (props.embedded) emit('exit', current.value, active.value.folder)
  else void navigateTo('/workshop/join', { replace: true })
}
function rejoin() {
  session.left = false
  post({ tipo: 'hola' })
  presence()
  presenceTimer = setInterval(latido, ritmo.value.senal)
}
// Al irse, el dispositivo se despide. Se quita al desmontar: con el canal ya cerrado, despedirse falla.
const sayGoodbye = () => { if (!session.removed && me.value) post({ tipo: 'adios', id: me.value.id }) }
function obey(accion: Extract<SessionMessage, { tipo: 'orden' }>['accion']) {
  if (session.removed) return
  if (accion === 'pausa' || accion === 'libera') session.held = accion === 'pausa'
  else if (accion === 'reinicio') { if (session.open) restartScene(current.value) }
  else if (accion === 'quitar') {
    Object.assign(session, { removed: true, open: false, held: false })
    clearInterval(presenceTimer)
    if (me.value) post({ tipo: 'adios', id: me.value.id })
    cerrarDelTodo()
    return
  }
  presence()
}

function onSessionMessage({ data: recibido }: { data: unknown }) {
  // Lo que llega por la conexión lo puede mandar cualquiera que tenga el código: solo lo que tiene la forma esperada.
  const data = leerMensaje(recibido)
  if (!data) return
  if (props.mode === 'educator') {
    if (data.tipo === 'hola') publish()
    else if (data.tipo === 'solicitud') pedirSolicitudes()
    else if (data.tipo === 'presencia') {
      // Con la conexión del taller, solo cuenta quien el educador aprobó; si no lo conoce, lo pregunta a la base.
      if (conexionApi && !aprobados.has(data.id)) {
        pedirSolicitudes()
        return
      }
      if (!devices.has(data.id)) anotarPresencia(data.id, true)
      devices.set(data.id, { ...devices.get(data.id), ...data, seen: Date.now() })
    }
    else if (data.tipo === 'adios') {
      if (devices.delete(data.id)) anotarPresencia(data.id, false)
      if (selectedDevice.value === data.id) selectedDevice.value = null
      // Quien esperaba y se fue de su página retiró su solicitud: la lista, al día.
      if (solicitudes.value.some(s => s.id === data.id)) pedirSolicitudes()
    }
  }
  else if (props.mode === 'device') {
    // Quien salió ya no sigue la sesión hasta que vuelve a entrar.
    if (session.left) return
    if (data.tipo === 'estado') applyState(data)
    else if (data.tipo === 'orden' && data.id === me.value?.id) obey(data.accion)
    // El taller terminó. Con la conexión del taller, la sesión se cierra del todo y va a la página inicial (Luis,
    // 2026-11-26: las pantallas se quedaban congeladas en «El taller terminó»); en la demostración, la ventana.
    else if (data.tipo === 'cierre' && !session.removed) {
      if (props.conexion) cerrarDelTodo()
      else Object.assign(session, { open: false, closed: true })
    }
  }
}

let sweeper: ReturnType<typeof setInterval> | undefined

// Cada cuánto da señales un dispositivo y cuándo se le da por ido: más espaciado por la conexión del taller.
const ritmo = computed(() => (props.conexion ? RITMO.conexion : RITMO.demostracion))

// ── Conexión del taller en la pantalla del educador (tarea 013) ───────────────
// Con la llave, ve quién pide entrar, lo aprueba o lo rechaza y anota quién entra y sale (su tiempo conectado). La
// base manda: un dispositivo que no aprobó no aparece aunque dé señales.
type ConexionEducador = ReturnType<typeof import('./conexion/realtime')['conexionDelEducador']>
let conexionApi: ConexionEducador | null = null
const solicitudes = ref<{ id: string, nombre: string, avatar: Avatar, tono: TonoAvatar }[]>([])
const aprobados = new Set<string>()
// Cómo se llama cada uno en la lista: su apodo o el nombre del avatar, con un número si se repite (por orden de llegada).
const nombres = shallowRef(new Map<string, string>())
const sinAprobar = ref(false)

async function refrescarSolicitudes() {
  if (!conexionApi) return
  try {
    const lista = await conexionApi.participantes()
    const avatar = (a: string) => (AVATARES.some(x => x.clave === a) ? a as Avatar : 'zorro')
    nombres.value = nombresSinRepetir(estanAhora(lista, devices).map(p => ({ id: p.dispositivo, nombre: nombreVisible(p.apodo, avatar(p.avatar)) })))
    aprobados.clear()
    lista.filter(p => p.estado === 'aprobado').forEach(p => aprobados.add(p.dispositivo))
    solicitudes.value = lista.filter(p => p.estado === 'esperando').map(p => ({
      id: p.dispositivo,
      nombre: nombres.value.get(p.dispositivo) ?? nombreVisible(p.apodo, avatar(p.avatar)),
      avatar: avatar(p.avatar),
      tono: tonoDe(p.avatar),
    }))
    // Quien ya no está aprobado (quitado desde otra pantalla) sale de la lista.
    devices.forEach((_, id) => { if (!aprobados.has(id)) devices.delete(id) })
    if (sinAprobar.value && solicitudes.value.length) await aprobar(null)
  }
  catch { /* sin red: se vuelve a pedir con la próxima señal */ }
}

// Mientras alguien espera, la lista se vuelve a pedir cada 15 s: así sale la solicitud de un dispositivo que se fue sin
// avisar (la base deja de contarla a los 45 s sin señal), aunque nadie más mande nada.
let relecturaSolicitudes: ReturnType<typeof setInterval> | undefined
watch(() => solicitudes.value.length > 0, (hay) => {
  clearInterval(relecturaSolicitudes)
  if (hay) relecturaSolicitudes = setInterval(() => void refrescarSolicitudes(), 15_000)
})
onBeforeUnmount(() => clearInterval(relecturaSolicitudes))

// Muchas solicitudes seguidas (una por dispositivo cada pocos segundos) piden la lista una sola vez.
let pedidoSolicitudes: ReturnType<typeof setTimeout> | undefined
function pedirSolicitudes() {
  if (!conexionApi || pedidoSolicitudes) return
  pedidoSolicitudes = setTimeout(() => {
    pedidoSolicitudes = undefined
    void refrescarSolicitudes()
  }, 800)
}

/** Aprueba a uno o, sin id, a todos los que esperan, y les avisa para que entren. */
async function aprobar(id: string | null) {
  if (!conexionApi) return
  try {
    const ids = await conexionApi.aprobar(id ? [id] : null)
    if (ids.length) post({ tipo: 'aprobado', ids })
    await refrescarSolicitudes()
  }
  catch { announce(txt('connectionLost')) }
}

async function rechazar(id: string) {
  if (!conexionApi) return
  try {
    await conexionApi.rechazar(id)
    post({ tipo: 'rechazado', id })
    await refrescarSolicitudes()
  }
  catch { announce(txt('connectionLost')) }
}

function setSinAprobar(valor: boolean) {
  sinAprobar.value = valor
  if (valor && solicitudes.value.length) void aprobar(null)
}

// Quién entra y quién sale, para el tiempo conectado: se juntan y se anotan cada pocos segundos.
const entran = new Set<string>()
const salen = new Set<string>()
let anotador: ReturnType<typeof setInterval> | undefined
function anotarPresencia(id: string, entra: boolean) {
  if (!conexionApi || id.startsWith('prueba-')) return
  if (entra) { entran.add(id); salen.delete(id) }
  else { salen.add(id); entran.delete(id) }
}
function enviarPresencia() {
  if (!conexionApi || (!entran.size && !salen.size)) return
  const e = [...entran]
  const s = [...salen]
  entran.clear()
  salen.clear()
  void conexionApi.presencia(e, s).catch(() => {
    e.forEach(id => entran.add(id))
    s.forEach(id => salen.add(id))
  })
}

// El código para unirse, su enlace (el del QR), la dirección corta para escribirlo y la misma con su protocolo (la que
// se copia). La dirección es la de la app del hogar en la base (`configuraciones.home_url`) o, sin ella, la de Player.
// En desarrollo, si es localhost, la IP de este equipo en la red: localhost, en un teléfono, es el propio teléfono.
const ipEnLaRed = useRuntimeConfig().public.ipEnLaRed as string | undefined
const urlPlayer = ref<string | null>(null)
const urlHogar = ref<string | null>(null)
watch(() => props.conexion, async (c) => {
  if (!c || !import.meta.client || urlPlayer.value) return
  const urls = await urlsDelRunner()
  urlPlayer.value = urls.player ?? null
  urlHogar.value = urls.home ?? null
}, { immediate: true })
const conexionVista = computed(() => {
  if (!props.conexion || !import.meta.client) return null
  // Desde el 2026-11-27 el QR lleva a la app del hogar, `/code/<código>` (tarea 025); sin su dirección en la base, a la
  // página para unirse de Player, como antes.
  const enHogar = Boolean(urlHogar.value)
  const base = origenParaUnirse(enHogar ? urlHogar.value : urlPlayer.value, window.location, ipEnLaRed)
  const ruta = enHogar ? '/code' : '/workshop/join'
  return { codigo: props.conexion.codigo, enlace: `${base}${ruta}/${props.conexion.codigo}`, direccion: `${base.replace(/^https?:\/\//, '')}${ruta}`, url: `${base}${ruta}` }
})

// Dispositivo con la conexión del taller: si sigue aprobado y el taller abierto (abrirSesion).
let comprobarSesion: (() => Promise<boolean>) | null = null

// Abre la sesión: la conexión del taller si la hay (la del educador llega de la app después de «listo»), o la
// demostración. Volver a abrirla (otra llave al recargar la app) cierra la anterior. Un ensayo (`rehearsal`) no tiene sesión.
async function abrirSesion() {
  channel?.close()
  channel = null
  conexionApi = null
  clearInterval(anotador)
  if (props.mode === 'preview' || props.rehearsal) return
  if (props.conexion) {
    const realtime = await import('./conexion/realtime')
    if (unmounted) return
    channel = realtime.abrirCanal(props.conexion.codigo, props.mode === 'educator' ? 'educador' : 'dispositivo')
    if (props.mode === 'educator' && props.conexion.llave) {
      conexionApi = realtime.conexionDelEducador(props.conexion.codigo, props.conexion.llave)
      devices.forEach((device, id) => { if (device.prueba) devices.delete(id) })
      anotador = setInterval(enviarPresencia, 5000)
      void refrescarSolicitudes()
    }
    if (props.mode === 'device') {
      // Solo sigue quien el educador aprobó: si todavía espera, a la página para unirse; si el taller terminó, o lo
      // quitaron o lo rechazaron sin que se enterara (sin red), la sesión se cierra del todo, como al recibir el aviso.
      // Se pregunta al abrir y cada vez que vuelve a escuchar tras perder la red (`alConectar`): un cierre perdido no
      // deja la pantalla congelada. Sin respuesta de la base, sigue.
      const api = realtime.conexionDelDispositivo(props.conexion.codigo)
      const codigo = props.conexion.codigo
      comprobarSesion = async () => {
        if (!me.value || session.left || session.removed) return false
        const estado = await api.estado(me.value.id).catch(() => 'aprobado' as const)
        if (unmounted || estado === 'aprobado') return !unmounted
        if (estado === 'esperando') void navigateTo(`/workshop/join/${codigo}`, { replace: true })
        else cerrarDelTodo()
        return false
      }
      if (!(await comprobarSesion())) return
    }
  }
  else channel = canalDemostracion()
  if (!channel) return
  channel.onmessage = onSessionMessage
  if (props.mode === 'educator') publish()
  if (props.mode === 'device' && me.value) {
    post({ tipo: 'hola' })
    presence()
  }
  // Por la conexión del taller, el «hola» de arriba sale antes de que el dispositivo escuche: la respuesta del educador
  // (la escena) se perdía y se quedaba en «Esperando al educador» aunque estaba aprobado (Luis, 2026-11-26). Lo repite
  // cuando ya escucha, y cada vez que vuelve a escuchar tras perder la red. El educador, al volver, manda la escena.
  channel.alConectar = () => {
    if (props.mode === 'educator') publish()
    else if (props.mode === 'device' && me.value && !session.left && !session.removed) {
      post({ tipo: 'hola' })
      presence()
      void comprobarSesion?.()
    }
  }
}
watch(() => `${props.conexion?.codigo ?? ''}|${props.conexion?.llave ?? ''}`, () => void abrirSesion())

// ── Teclado: los presentadores inalámbricos mandan Av Pág / Re Pág. Un dispositivo no tiene teclas.
function onKey(event: KeyboardEvent) {
  if (props.mode === 'device' || event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || event.repeat) return
  if (document.querySelector('dialog[open]')) return
  const key = event.key
  const sheetOpen = Boolean(activeState.value.message) && !guideOpen.value && !devicesOpen.value && !railOpen.value && !scenesOpen.value
  if (key === 'Escape') {
    if (scenesOpen.value) setScenes(false)
    else if (devicesOpen.value) setDevices(false)
    else if (railOpen.value) setRail(false)
    else if (guideOpen.value) setGuide(false)
    else if (sheetOpen) closeFeedback()
    else if (overlay.value?.action) resume()
    return
  }
  // El resto de teclas son de las pestañas de la guía y de cualquier campo con el foco.
  if ((event.target as HTMLElement).closest?.('input, select, textarea, [contenteditable], [role=tablist]')) return
  if (sheetOpen && ['ArrowRight', 'PageDown', 'ArrowLeft', 'PageUp'].includes(key)) closeFeedback(false)
  const educator = props.mode === 'educator'
  const actions: Record<string, (() => void) | null> = {
    ArrowRight: next,
    PageDown: next,
    ArrowLeft: previous,
    PageUp: previous,
    p: educator ? () => setPause('manual', !manualPause.value) : null,
    g: educator ? () => setGuide(!guideOpen.value) : null,
    m: toggleMute,
    f: toggleFullscreen,
  }
  const action = actions[key.length === 1 ? key.toLowerCase() : key]
  if (action) {
    event.preventDefault()
    action()
  }
}

// ── Protección táctil: sin zoom de dedos ni de trackpad, sin menú contextual ni arrastre de imágenes.
const blockEvent = (event: Event) => event.preventDefault()
const BLOCKED = ['gesturestart', 'gesturechange', 'gestureend', 'contextmenu', 'dragstart', 'dblclick'] as const
// Sin selección, ni siquiera de la página entera: en Android, un toque largo sobre una selección la arrastra, y Chrome
// la pinta como un fantasma de todo el juego, solo con los bordes de las piezas (Luis, 2026-11-27, en Descubrimiento
// desde una tableta unida por el QR). El CSS ya no deja seleccionar nada; esto no deja que una selección empiece y
// borra la que hubiera al tocar. Un campo de texto sí se selecciona.
const enCampo = (target: EventTarget | null) => {
  const nodo = target instanceof Element ? target : target instanceof Node ? target.parentElement : null
  return Boolean(nodo?.closest('input, textarea, [contenteditable]'))
}
const blockSelect = (event: Event) => { if (!enCampo(event.target)) event.preventDefault() }
const dropSelection = (event: Event) => {
  const seleccion = document.getSelection()
  if (seleccion && !seleccion.isCollapsed && !enCampo(event.target)) seleccion.removeAllRanges()
}
const onWheel = (event: WheelEvent) => { if (event.ctrlKey) event.preventDefault() }
const onVisibility = () => { if (props.mode !== 'device') setPause('hidden', document.hidden) }

const frame = ref<HTMLElement | null>(null)
const probe = ref<HTMLElement | null>(null)
// Cada vez que el marco se encaja (al montarse y con cada cambio de tamaño), la escena que se ve vuelve a ajustar lo
// suyo. Puede pedírselo antes de que su personaje termine de cargar: él lo deja pasar y se ajusta solo al cargar.
// La vista previa no tiene consola ni pie: su escena se encaja en todo el alto.
const { compact } = useFrameFit(frame, probe, () => instances.get(current.value)?.fit?.(), {
  sinBarra: props.mode === 'preview',
  sinPie: props.mode === 'preview',
  pieSinControles: props.mode === 'device',
})

// En iOS un botón solo muestra su estado pulsado si la página escucha los toques: con esto responde al instante.
const onTouchStart = () => {}

// La pantalla no se apaga durante el taller, como en una app. Si el navegador no lo permite, no pasa nada; al volver
// a la pestaña se pide otra vez, porque el sistema lo suelta al ocultarla.
let wakeLock: { release: () => Promise<void> } | null = null
async function keepAwake() {
  if (props.mode === 'preview' || document.hidden) return
  try {
    const lock = (navigator as Navigator & { wakeLock?: { request: (type: 'screen') => Promise<{ release: () => Promise<void> }> } }).wakeLock
    wakeLock = await lock?.request('screen') ?? null
  }
  catch { /* sin permiso o sin soporte */ }
}
const onWake = () => { if (!document.hidden) void keepAwake() }

// Lo primero que se ve se prepara antes de enseñar nada. Con mala red no se espera para siempre: al agotar el plazo se
// muestra lo que haya y lo demás llega después, como antes.
const LOAD_LIMIT = 10_000
let unmounted = false
async function start() {
  const first = current.value
  mark('inicio')
  await within(LOAD_LIMIT, Promise.all([fontsReady(), preloadScene(scenes[first]!), props.mode === 'home' ? decodeImage(dibujoDe(player.avatar)) : null]))
  if (unmounted) return
  mark('preparado')
  if (props.mode === 'device') mountScene(first)
  else goTo(first, false)
  await sceneLoad.whenShown(first)
  if (unmounted) return
  loaded.value = true
  // Cuándo aparece el marco entero.
  mark('listo')
  entering.value = true
  setTimeout(() => { entering.value = false }, 400)
  emit('ready')
  if (props.mode !== 'device') emit('scene', first, scenes[first]!.folder)
  warmNext()
  // El resto de las escenas se preparan mientras se juega la primera.
  for (const scene of scenes) {
    if (unmounted) return
    await preloadScene(scene)
  }
}

// ── El sonido de la interfaz (el motor, `engine/sound.ts`), con su propio material, distinto del de las piezas: pulsar
// un control y desplegar o recoger un panel o una ventana. Cada interacción suena una vez: si el botón pulsado
// despliega o recoge algo, suena solo eso. Pasar de escena no tiene sonido propio: «Siguiente» suena como cualquier
// botón. Las piezas del tablero suenan por su cuenta, y la hoja, con su respuesta.
function onPress(event: MouseEvent) {
  const control = (event.target as Element | null)?.closest?.('button, a[href], summary, [role=tab], [role=button]')
  if (!control || (control as HTMLButtonElement).disabled) return
  // Ni las piezas del tablero ni los paneles de prueba (el medidor y el de sonidos).
  if (control.closest('.tb-board, .player-meter, .player-sounds')) return
  cueInterface('pulsar')
}
const somethingOpen = computed(() => guideOpen.value || scenesOpen.value || railOpen.value || devicesOpen.value || confirmOpen.value || Boolean(overlay.value))
watch(somethingOpen, (open) => { if (loaded.value) cueInterface(open ? 'abrir' : 'cerrar') })

onMounted(() => {
  // En la captura: se anota el pulso antes de que el botón haga lo suyo, y lo que haga decide qué suena.
  document.addEventListener('click', onPress, true)
  BLOCKED.forEach(type => document.addEventListener(type, blockEvent))
  document.addEventListener('selectstart', blockSelect)
  document.addEventListener('pointerdown', dropSelection, true)
  window.addEventListener('wheel', onWheel, { passive: false })
  document.addEventListener('keydown', onKey)
  document.addEventListener('pointerdown', onPointerDown)
  document.addEventListener('fullscreenchange', onFullscreen)
  document.addEventListener('webkitfullscreenchange', onFullscreen)
  document.addEventListener('visibilitychange', onVisibility)
  document.addEventListener('visibilitychange', onWake)
  document.addEventListener('touchstart', onTouchStart, { passive: true })
  canFullscreen.value = Boolean(document.fullscreenEnabled || doc().webkitFullscreenEnabled) && !appEnPantallaCompleta() && !props.instalada
  onFullscreen()
  void keepAwake()

  if (props.mode === 'educator') {
    // Un dispositivo real que deja de dar señales sale de la lista.
    sweeper = setInterval(() => {
      const now = Date.now()
      devices.forEach((device, id) => {
        if (!device.prueba && now - (device.seen ?? now) > ritmo.value.ido) {
          devices.delete(id)
          anotarPresencia(id, false)
          if (selectedDevice.value === id) selectedDevice.value = null
        }
      })
    }, 2000)
  }

  if (props.mode === 'device') {
    me.value = deviceIdentity()
    // Con la conexión del taller y sin haber elegido avatar en este dispositivo: a la página para unirse.
    if (!me.value && props.conexion) {
      void navigateTo(`/workshop/join/${props.conexion.codigo}`, { replace: true })
      return
    }
    presenceTimer = setInterval(latido, ritmo.value.senal)
    window.addEventListener('pagehide', sayGoodbye)
  }
  // La vista previa no es un taller: no abre la sesión con los dispositivos.
  void abrirSesion()
  void start()
})

onBeforeUnmount(() => {
  unmounted = true
  sceneLoad.dispose()
  void wakeLock?.release().catch(() => {})
  document.removeEventListener('visibilitychange', onWake)
  document.removeEventListener('touchstart', onTouchStart)
  BLOCKED.forEach(type => document.removeEventListener(type, blockEvent))
  document.removeEventListener('selectstart', blockSelect)
  document.removeEventListener('pointerdown', dropSelection, true)
  window.removeEventListener('wheel', onWheel)
  document.removeEventListener('keydown', onKey)
  document.removeEventListener('pointerdown', onPointerDown)
  document.removeEventListener('click', onPress, true)
  document.removeEventListener('fullscreenchange', onFullscreen)
  document.removeEventListener('webkitfullscreenchange', onFullscreen)
  document.removeEventListener('visibilitychange', onVisibility)
  window.removeEventListener('pagehide', sayGoodbye)
  clearInterval(sweeper)
  clearInterval(presenceTimer)
  clearInterval(anotador)
  clearTimeout(pedidoSolicitudes)
  enviarPresencia()
  clearTimeout(noteTimer)
  clearTimeout(burstTimer)
  channel?.close()
  cancelNarration()
})

// Vista previa: la app que lo incrusta conduce (docs/runner.md). Una carpeta que no existe no mueve nada.
defineExpose({
  ir: (escena: number | string) => goTo(typeof escena === 'number' ? escena : scenes.findIndex(s => s.folder === escena)),
  reiniciar: () => {
    cancelNarration()
    restartScene(current.value)
  },
})

useHead({ title: computed(() => `${active.value.title} · ${text(props.storyboard.json.title)} · PlayHub`) })
</script>
