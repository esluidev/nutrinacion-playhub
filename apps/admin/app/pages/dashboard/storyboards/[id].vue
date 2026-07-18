<template>
  <div v-if="storyboard">
    <!-- Back + Title Bar -->
    <div class="card mb-6">
      <div class="px-5 py-4 flex items-center gap-4">
        <button
          class="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors shrink-0"
          @click="navigateTo('/dashboard/storyboards')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <div class="min-w-0 flex-1">
          <h1 class="font-display font-bold text-brand-dark text-lg leading-snug truncate">
            {{ storyboard.title }}
          </h1>
        </div>
        <UiButton variant="primary" size="sm" class="shrink-0" @click="navigateTo('/dashboard/workshops/new?storyboard=' + storyboard.id)">
          <svg class="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
          Usar en Taller
        </UiButton>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left Column: Main Content -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Cover -->
        <div :class="['relative h-56 rounded-2xl overflow-hidden shadow-sm', storyboard.coverBg]">
          <div class="absolute inset-0 opacity-10">
            <svg class="w-full h-full" viewBox="0 0 400 200" fill="none">
              <circle cx="300" cy="30" r="80" fill="currentColor" />
              <circle cx="50" cy="160" r="60" fill="currentColor" />
              <circle cx="360" cy="170" r="40" fill="currentColor" />
            </svg>
          </div>
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <svg class="w-10 h-10 text-white/80" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Description -->
        <div class="card p-6">
          <h2 class="font-display font-bold text-brand-dark text-sm mb-3">Descripcion</h2>
          <p class="text-sm text-gray-500 leading-relaxed">
            {{ storyboard.description }}
          </p>
        </div>

        <!-- Objectives -->
        <div class="card p-6">
          <h2 class="font-display font-bold text-brand-dark text-sm mb-4">Objetivos de Aprendizaje</h2>
          <div class="space-y-3">
            <div
              v-for="(obj, i) in storyboard.objectives"
              :key="i"
              class="flex items-start gap-3"
            >
              <div class="w-6 h-6 rounded-lg bg-brand-primary-50 flex items-center justify-center shrink-0 mt-0.5">
                <svg class="w-3.5 h-3.5 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </div>
              <span class="text-sm text-gray-600 leading-relaxed">{{ obj }}</span>
            </div>
          </div>
        </div>

        <!-- Scenes Timeline -->
        <div>
          <div class="flex items-center gap-3 mb-5">
            <h2 class="font-display font-bold text-brand-dark text-base">Escenas</h2>
            <span class="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{{ storyboard.scenes.length }}</span>
            <div class="flex-1" />
            <button
              v-if="expandedSet.size > 0"
              class="text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors"
              @click="collapseAll"
            >
              Cerrar todo
            </button>
          </div>

          <!-- Scene Cards -->
          <div class="space-y-3">
            <div
              v-for="(scene, index) in storyboard.scenes"
              :key="scene.id"
              :class="[
                'group rounded-2xl border-2 transition-all duration-300 overflow-hidden',
                expandedSet.has(scene.id)
                  ? sceneTypeBorder[scene.type] + ' shadow-md'
                  : 'border-transparent shadow-sm hover:shadow-md hover:-translate-y-0.5',
                'bg-white',
              ]"
            >
              <!-- Scene Header (clickable) -->
              <button
                class="w-full text-left p-4 flex items-start gap-4"
                @click="toggle(scene.id)"
              >
                <!-- Scene Number + Type Icon -->
                <div :class="[
                  'w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                  sceneTypeBg[scene.type],
                ]">
                  <component :is="sceneTypeIcon[scene.type]" class="w-5 h-5" />
                </div>

                <!-- Info -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-[10px] font-bold text-gray-300 uppercase">{{ String(index + 1).padStart(2, '0') }}</span>
                    <span :class="['text-[10px] font-bold uppercase tracking-wide', sceneTypeTextColor[scene.type]]">
                      {{ sceneTypeLabel[scene.type] }}
                    </span>
                  </div>
                  <p class="text-sm font-bold text-brand-dark leading-snug mb-1">{{ scene.title }}</p>
                  <p class="text-xs text-gray-400 leading-relaxed line-clamp-2">{{ scene.description }}</p>
                </div>

                <!-- Expand Arrow -->
                <div :class="[
                  'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-all duration-200',
                  expandedSet.has(scene.id) ? 'bg-gray-100 rotate-180' : 'bg-gray-50 group-hover:bg-gray-100',
                ]">
                  <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </button>

              <!-- Expanded Content -->
              <div v-show="expandedSet.has(scene.id)" class="px-4 pb-5">
                <div class="ml-15 space-y-4">
                  <!-- Divider -->
                  <div class="border-t border-gray-100" />

                  <!-- Objective -->
                  <div class="flex items-start gap-3">
                    <div class="w-7 h-7 rounded-lg bg-brand-primary-50 flex items-center justify-center shrink-0 mt-0.5">
                      <svg class="w-3.5 h-3.5 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
                      </svg>
                    </div>
                    <div>
                      <p class="text-[10px] font-bold text-gray-300 uppercase tracking-wider mb-0.5">Objetivo</p>
                      <p class="text-sm text-gray-600 leading-relaxed">{{ scene.objective }}</p>
                    </div>
                  </div>

                  <!-- Pedagogical Guide Card -->
                  <div v-if="scene.guide" :class="[
                    'rounded-xl border p-5 space-y-4',
                    sceneGuideCardBg[scene.type],
                  ]">
                    <!-- Guide Header -->
                    <div class="flex items-center gap-2.5">
                      <div :class="['w-7 h-7 rounded-lg flex items-center justify-center', sceneGuideIconBg[scene.type]]">
                        <svg class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                        </svg>
                      </div>
                      <span class="text-xs font-bold text-gray-600 uppercase tracking-wider">Guia para el Educador</span>
                    </div>

                    <!-- Meta -->
                    <div>
                      <div class="flex items-center gap-1.5 mb-1.5">
                        <svg class="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                        </svg>
                        <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Meta</span>
                      </div>
                      <p class="text-sm text-gray-600 leading-relaxed">{{ scene.guide.goal }}</p>
                    </div>

                    <!-- Guion -->
                    <div>
                      <div class="flex items-center gap-1.5 mb-1.5">
                        <svg class="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                        </svg>
                        <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Guion</span>
                      </div>
                      <p class="text-sm text-gray-600 leading-relaxed">{{ scene.guide.script }}</p>
                    </div>

                    <!-- Tips -->
                    <div v-if="scene.guide.tips && scene.guide.tips.length > 0">
                      <div class="flex items-center gap-1.5 mb-2">
                        <svg class="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                        </svg>
                        <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Consejos</span>
                      </div>
                      <div class="space-y-2">
                        <div
                          v-for="(tip, ti) in scene.guide.tips"
                          :key="ti"
                          class="flex items-start gap-2.5"
                        >
                          <div :class="['w-1.5 h-1.5 rounded-full shrink-0 mt-1.5', sceneGuideIconBg[scene.type]]" />
                          <p class="text-sm text-gray-500 leading-relaxed">{{ tip }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Sidebar Info -->
      <div class="space-y-6">
        <!-- Quick Info -->
        <div class="card p-6 space-y-4">
          <h2 class="font-display font-bold text-brand-dark text-sm">Informacion</h2>

          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 text-gray-400">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
                <span class="text-xs">Edad objetivo</span>
              </div>
              <span class="text-sm font-semibold text-brand-dark">{{ storyboard.targetAge }}</span>
            </div>

            <div class="divider" />

            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 text-gray-400">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                <span class="text-xs">Duracion</span>
              </div>
              <span class="text-sm font-semibold text-brand-dark">{{ storyboard.duration }}</span>
            </div>

            <div class="divider" />

            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 text-gray-400">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0 1 18 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5c0 .621-.504 1.125-1.125 1.125m1.5 0h12m-12 0c-.621 0-1.125.504-1.125 1.125" />
                </svg>
                <span class="text-xs">Escenas</span>
              </div>
              <span class="text-sm font-semibold text-brand-dark">{{ storyboard.scenes.length }}</span>
            </div>

            <div class="divider" />

            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 text-gray-400">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6Z" />
                </svg>
                <span class="text-xs">Categoria</span>
              </div>
              <span class="text-sm font-semibold text-brand-dark">{{ storyboard.category }}</span>
            </div>

            <div class="divider" />

            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 text-gray-400">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
                </svg>
                <span class="text-xs">Plan</span>
              </div>
              <span :class="['badge', planBadgeVariant]">{{ storyboard.plan }}</span>
            </div>
          </div>
        </div>

        <!-- Scene Types Legend -->
        <div class="card p-6">
          <h2 class="font-display font-bold text-brand-dark text-sm mb-4">Tipos de Escena</h2>
          <div class="space-y-2.5">
            <div
              v-for="(label, typeKey) in sceneTypeLabel"
              :key="typeKey"
              class="flex items-center gap-2.5"
            >
              <div :class="['w-7 h-7 rounded-lg flex items-center justify-center', sceneTypeBg[typeKey]]">
                <component :is="sceneTypeIcon[typeKey]" class="w-3.5 h-3.5" />
              </div>
              <span class="text-sm text-gray-500">{{ label }}</span>
              <span class="ml-auto text-xs font-semibold text-gray-300">
                {{ storyboard.scenes.filter(s => s.type === typeKey).length || '-' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Materials -->
        <div class="card p-6">
          <h2 class="font-display font-bold text-brand-dark text-sm mb-4">Materiales Necesarios</h2>
          <div class="space-y-2.5">
            <div
              v-for="(mat, i) in storyboard.materials"
              :key="i"
              class="flex items-center gap-2.5"
            >
              <div class="w-1.5 h-1.5 rounded-full bg-brand-secondary shrink-0" />
              <span class="text-sm text-gray-500">{{ mat }}</span>
            </div>
          </div>
        </div>

        <!-- Usage Stats (mock) -->
        <div class="card p-6">
          <h2 class="font-display font-bold text-brand-dark text-sm mb-4">Estadisticas</h2>
          <div class="grid grid-cols-2 gap-4">
            <div class="text-center p-3 rounded-xl bg-brand-primary-50/50">
              <p class="text-2xl font-display font-bold text-brand-primary">{{ 12 + storyboard.id * 3 }}</p>
              <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mt-1">Veces usado</p>
            </div>
            <div class="text-center p-3 rounded-xl bg-brand-secondary-50/50">
              <p class="text-2xl font-display font-bold text-brand-secondary">{{ 4 + storyboard.id }}</p>
              <p class="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mt-1">Educadores</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Not Found -->
  <div v-else class="card p-16 flex flex-col items-center justify-center text-center">
    <div class="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center mb-5">
      <svg class="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
      </svg>
    </div>
    <h3 class="font-display font-bold text-brand-dark text-lg mb-2">Storyboard no encontrado</h3>
    <p class="text-sm text-gray-400 max-w-sm leading-relaxed">
      El storyboard que buscas no existe o ha sido eliminado.
    </p>
    <UiButton variant="outline" size="sm" class="mt-5" @click="navigateTo('/dashboard/storyboards')">
      Volver a Storyboards
    </UiButton>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const { getStoryboard } = useStoryboards()

const storyboardId = Number(route.params.id)
const storyboard = computed(() => getStoryboard(storyboardId))

const planBadgeVariant = computed(() => {
  if (!storyboard.value) return ''
  const map: Record<string, string> = {
    Gratuito: 'badge-green',
    Premium: 'badge-coral',
    Personalizado: 'badge-purple',
  }
  return map[storyboard.value.plan] || 'badge-gray'
})

// --- Scene type visual config ---
const sceneTypeLabel: Record<string, string> = {
  'narracion': 'Narracion',
  'mini-juego': 'Mini-juego',
  'actividad': 'Actividad',
  'reflexion': 'Reflexion',
  'evaluacion': 'Evaluacion',
}

const sceneTypeBg: Record<string, string> = {
  'narracion': 'bg-sky-100',
  'mini-juego': 'bg-violet-100',
  'actividad': 'bg-amber-100',
  'reflexion': 'bg-emerald-100',
  'evaluacion': 'bg-rose-100',
}

const sceneTypeTextColor: Record<string, string> = {
  'narracion': 'text-sky-500',
  'mini-juego': 'text-violet-500',
  'actividad': 'text-amber-500',
  'reflexion': 'text-emerald-500',
  'evaluacion': 'text-rose-500',
}

const sceneTypeBorder: Record<string, string> = {
  'narracion': 'border-sky-200',
  'mini-juego': 'border-violet-200',
  'actividad': 'border-amber-200',
  'reflexion': 'border-emerald-200',
  'evaluacion': 'border-rose-200',
}

const sceneGuideCardBg: Record<string, string> = {
  'narracion': 'bg-sky-50/50 border-sky-100',
  'mini-juego': 'bg-violet-50/50 border-violet-100',
  'actividad': 'bg-amber-50/50 border-amber-100',
  'reflexion': 'bg-emerald-50/50 border-emerald-100',
  'evaluacion': 'bg-rose-50/50 border-rose-100',
}

const sceneGuideIconBg: Record<string, string> = {
  'narracion': 'bg-sky-400',
  'mini-juego': 'bg-violet-400',
  'actividad': 'bg-amber-400',
  'reflexion': 'bg-emerald-400',
  'evaluacion': 'bg-rose-400',
}

// Icon components per scene type (render functions)
const IconNarracion = defineComponent({
  render: () => h('svg', { class: 'w-5 h-5 text-sky-600', fill: 'none', viewBox: '0 0 24 24', 'stroke-width': '1.75', stroke: 'currentColor' }, [
    h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25' }),
  ]),
})

const IconMiniJuego = defineComponent({
  render: () => h('svg', { class: 'w-5 h-5 text-violet-600', fill: 'none', viewBox: '0 0 24 24', 'stroke-width': '1.75', stroke: 'currentColor' }, [
    h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 0 1-.657.643 48.491 48.491 0 0 1-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 0 1-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 0 0-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 0 1-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 0 0 .657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 0 1-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 0 0 5.427-.63 48.05 48.05 0 0 0 .582-4.717.532.532 0 0 0-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.96.401v0a.656.656 0 0 0 .658-.663 48.422 48.422 0 0 0-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 0 1-.61-.58v0Z' }),
  ]),
})

const IconActividad = defineComponent({
  render: () => h('svg', { class: 'w-5 h-5 text-amber-600', fill: 'none', viewBox: '0 0 24 24', 'stroke-width': '1.75', stroke: 'currentColor' }, [
    h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42' }),
  ]),
})

const IconReflexion = defineComponent({
  render: () => h('svg', { class: 'w-5 h-5 text-emerald-600', fill: 'none', viewBox: '0 0 24 24', 'stroke-width': '1.75', stroke: 'currentColor' }, [
    h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18' }),
  ]),
})

const IconEvaluacion = defineComponent({
  render: () => h('svg', { class: 'w-5 h-5 text-rose-600', fill: 'none', viewBox: '0 0 24 24', 'stroke-width': '1.75', stroke: 'currentColor' }, [
    h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z' }),
  ]),
})

const sceneTypeIcon: Record<string, ReturnType<typeof defineComponent>> = {
  'narracion': IconNarracion,
  'mini-juego': IconMiniJuego,
  'actividad': IconActividad,
  'reflexion': IconReflexion,
  'evaluacion': IconEvaluacion,
}

// --- Expandable state using reactive Set ---
const expandedSet = reactive(new Set<number>())

function toggle(sceneId: number) {
  if (expandedSet.has(sceneId)) {
    expandedSet.delete(sceneId)
  }
  else {
    expandedSet.add(sceneId)
  }
}

function collapseAll() {
  expandedSet.clear()
}
</script>

<style scoped>
.ml-15 {
  margin-left: 3.75rem;
}
</style>
