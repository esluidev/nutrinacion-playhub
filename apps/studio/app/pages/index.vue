<template>
  <div>
    <!-- Page Header -->
    <div class="mb-6">
      <h2 class="text-2xl font-display font-bold text-brand-dark">Dashboard</h2>
      <p class="text-sm text-gray-500 mt-1">Resumen del contenido en StoryPlay Studio</p>
    </div>

    <!-- Stat Cards Row 1 -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="card p-5">
        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Storyboards</p>
        <p class="text-3xl font-display font-bold text-brand-dark">{{ stats.totalStoryboards }}</p>
        <p class="text-xs text-gray-400 mt-1">en total</p>
      </div>
      <div class="card p-5">
        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Publicados</p>
        <p class="text-3xl font-display font-bold text-brand-primary">{{ stats.publishedStoryboards }}</p>
        <p class="text-xs text-gray-400 mt-1">disponibles</p>
      </div>
      <div class="card p-5">
        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">En Proceso</p>
        <p class="text-3xl font-display font-bold text-yellow-500">{{ stats.draftOrReviewStoryboards }}</p>
        <p class="text-xs text-gray-400 mt-1">borrador o revision</p>
      </div>
      <div class="card p-5">
        <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Escenas</p>
        <p class="text-3xl font-display font-bold text-brand-secondary">{{ stats.totalScenes }}</p>
        <p class="text-xs text-gray-400 mt-1">juegos totales</p>
      </div>
    </div>

    <!-- Stat Cards Row 2 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
      <!-- Pillar Distribution -->
      <div class="card p-5 lg:col-span-2">
        <h3 class="section-title mb-4">Distribucion por Pilar</h3>
        <div class="space-y-3">
          <div
            v-for="pillar in stats.pillarsDistribution"
            :key="pillar.pillar"
            class="flex items-center gap-3"
          >
            <div :class="['w-3 h-3 rounded-full shrink-0', pillar.color]" />
            <span class="text-sm text-gray-700 flex-1">{{ pillar.label }}</span>
            <span class="text-sm font-bold text-brand-dark">{{ pillar.count }}</span>
            <div class="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                :class="['h-full rounded-full transition-all', pillar.color]"
                :style="{ width: `${(pillar.count / stats.totalStoryboards) * 100}%` }"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Languages + Communities -->
      <div class="space-y-4">
        <div class="card p-5">
          <h3 class="section-title mb-3">Idiomas</h3>
          <div class="flex flex-wrap gap-2">
            <UiBadge
              v-for="lang in stats.languagesCovered"
              :key="lang"
              variant="blue"
            >
              {{ lang }}
            </UiBadge>
          </div>
        </div>
        <div class="card p-5">
          <h3 class="section-title mb-2">Comunidades Asignadas</h3>
          <p class="text-3xl font-display font-bold text-brand-purple">{{ stats.communitiesAssigned }}</p>
          <p class="text-xs text-gray-400 mt-1">con acceso personalizado</p>
        </div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="card">
      <div class="px-6 py-4 border-b border-gray-100">
        <h3 class="section-title">Actividad Reciente</h3>
      </div>
      <div class="divide-y divide-gray-100">
        <div
          v-for="activity in recentActivity"
          :key="activity.id"
          class="px-6 py-4 flex items-start gap-4"
        >
          <span :class="['text-[11px] font-semibold px-2 py-1 rounded-full shrink-0 mt-0.5', activityTypeColors[activity.type]]">
            {{ activityTypeLabels[activity.type] }}
          </span>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-brand-dark truncate">{{ activity.title }}</p>
            <p class="text-xs text-gray-400 mt-0.5">{{ activity.description }}</p>
          </div>
          <span class="text-xs text-gray-400 shrink-0">{{ activity.date }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { stats, recentActivity, activityTypeLabels, activityTypeColors } = useDashboardStats()
</script>
