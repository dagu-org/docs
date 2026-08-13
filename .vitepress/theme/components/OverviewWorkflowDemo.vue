<script setup>
import { computed, ref } from 'vue'
import aiYaml from './overview-workflows/ai.yaml?raw'
import scheduledYaml from './overview-workflows/scheduled.yaml?raw'
import serversYaml from './overview-workflows/servers.yaml?raw'

const demos = [
  {
    id: 'scheduled',
    label: 'Scheduled workloads',
    badge: 'Every day at 02:00',
    yaml: scheduledYaml,
    steps: [
      { id: 'prepare', title: 'Docker job', detail: 'Run Python in a clean container' },
      {
        id: 'process',
        title: 'Nested workflow',
        detail: 'Reuse data-pipeline as a child run',
        children: [
          { title: 'Extract', detail: 'python jobs/extract.py' },
          { title: 'Transform', detail: 'Docker · Python' },
          { title: 'Validate', detail: './scripts/validate-output.sh' },
        ],
      },
      { id: 'publish', title: 'Publish report', detail: 'Run the existing shell script' },
      { id: 'notify', title: 'Send email', detail: 'Notify operations' },
    ],
    states: [
      {
        button: 'Start scheduled run',
        active: ['prepare'],
        completed: [],
        announcement: 'Ready to run the scheduled workflow.',
      },
      {
        button: 'Run child workflow',
        active: ['process'],
        completed: ['prepare'],
        announcement: 'The Docker job completed. The parent is ready to start data-pipeline.',
      },
      {
        button: 'Continue parent',
        active: ['publish'],
        completed: ['prepare', 'process'],
        announcement: 'The child workflow completed. Control returned to the parent.',
      },
      {
        button: 'Replay',
        active: [],
        completed: ['prepare', 'process', 'publish', 'notify'],
        announcement: 'The report was published and the completion email was sent.',
      },
    ],
  },
  {
    id: 'ai',
    label: 'AI workflows',
    badge: 'AI with a human checkpoint',
    yaml: aiYaml,
    steps: [
      { id: 'collect', title: 'Collect context', detail: 'Run ./scripts/collect-errors.sh' },
      { id: 'propose', title: 'OpenCode', detail: 'Analyze and propose a safe fix' },
      { id: 'review', title: 'Human task', detail: 'Wait for a person to approve the plan' },
      { id: 'apply', title: 'Apply command', detail: 'Run the approved script' },
    ],
    states: [
      {
        button: 'Start AI workflow',
        active: ['collect'],
        completed: [],
        announcement: 'Ready to collect context for OpenCode.',
      },
      {
        button: 'Approve & continue',
        active: ['review'],
        completed: ['collect', 'propose'],
        announcement: 'OpenCode proposed a fix. The workflow is waiting for human approval.',
      },
      {
        button: 'Replay',
        active: [],
        completed: ['collect', 'propose', 'review', 'apply'],
        announcement: 'The approved command completed.',
      },
    ],
  },
  {
    id: 'servers',
    label: 'Server operations',
    badge: 'Safe remote operations',
    yaml: serversYaml,
    steps: [
      { id: 'inspect', title: 'SSH diagnosis', detail: 'Run systemctl --failed remotely' },
      { id: 'approve', title: 'Human task', detail: 'Wait for recovery approval' },
      { id: 'recover', title: 'SSH recovery', detail: 'Restart the remote service' },
      { id: 'email', title: 'Send email', detail: 'Notify the on-call team' },
    ],
    states: [
      {
        button: 'Start server check',
        active: ['inspect'],
        completed: [],
        announcement: 'Ready to inspect the remote server.',
      },
      {
        button: 'Approve recovery',
        active: ['approve'],
        completed: ['inspect'],
        announcement: 'The diagnosis completed. The workflow is waiting for recovery approval.',
      },
      {
        button: 'Replay',
        active: [],
        completed: ['inspect', 'approve', 'recover', 'email'],
        announcement: 'The remote service recovered and the on-call email was sent.',
      },
    ],
  },
]

const selectedId = ref('scheduled')
const progress = ref(0)
const showYaml = ref(false)
const demo = computed(() => demos.find((item) => item.id === selectedId.value))
const state = computed(() => demo.value.states[progress.value])
const isComplete = computed(() => progress.value === demo.value.states.length - 1)

function selectDemo(id) {
  selectedId.value = id
  progress.value = 0
  showYaml.value = false
}

function advance() {
  progress.value = isComplete.value ? 0 : progress.value + 1
}

function stepStatus(id) {
  if (state.value.completed.includes(id)) return 'completed'
  if (state.value.active.includes(id)) return 'active'
  return 'pending'
}
</script>

<template>
  <section class="workflow-demo" aria-label="Interactive Dagu workflow examples">
    <div class="workflow-demo-tabs" role="group" aria-label="Choose a workflow use case">
      <button
        v-for="item in demos"
        :id="`workflow-tab-${item.id}`"
        :key="item.id"
        type="button"
        :aria-pressed="selectedId === item.id"
        :aria-controls="`workflow-panel-${item.id}`"
        @click="selectDemo(item.id)"
      >
        {{ item.label }}
      </button>
    </div>

    <div
      :id="`workflow-panel-${demo.id}`"
      class="workflow-demo-panel"
      role="region"
      :aria-labelledby="`workflow-tab-${demo.id}`"
    >
      <p class="workflow-demo-badge">{{ demo.badge }}</p>

      <ol class="workflow-demo-steps">
        <li
          v-for="(step, index) in demo.steps"
          :key="step.id"
          :class="[`is-${stepStatus(step.id)}`, { 'has-children': step.children }]"
        >
          <span class="workflow-demo-marker" aria-hidden="true">
            {{ stepStatus(step.id) === 'completed' ? '✓' : index + 1 }}
          </span>
          <div class="workflow-demo-step-copy">
            <strong>{{ step.title }}</strong>
            <span>{{ step.detail }}</span>

            <ol
              v-if="step.children && progress >= 1"
              class="workflow-demo-children"
              aria-label="data-pipeline child workflow"
            >
              <li v-for="child in step.children" :key="child.title">
                <span class="workflow-demo-child-marker" aria-hidden="true">
                  {{ stepStatus(step.id) === 'completed' ? '✓' : '·' }}
                </span>
                <span>
                  <strong>{{ child.title }}</strong>
                  <small>{{ child.detail }}</small>
                </span>
              </li>
            </ol>
          </div>
        </li>
      </ol>

      <p class="workflow-demo-announcement" aria-live="polite">{{ state.announcement }}</p>

      <button class="workflow-demo-action" type="button" @click="advance">
        {{ state.button }}
      </button>
      <button
        class="workflow-demo-yaml-toggle"
        type="button"
        :aria-expanded="showYaml"
        :aria-controls="`workflow-yaml-${demo.id}`"
        @click="showYaml = !showYaml"
      >
        {{ showYaml ? 'Hide YAML' : 'View YAML' }}
      </button>

      <div v-show="showYaml" :id="`workflow-yaml-${demo.id}`" class="workflow-demo-yaml">
        <pre><code>{{ demo.yaml }}</code></pre>
      </div>
    </div>
  </section>
</template>

<style scoped>
.workflow-demo {
  min-width: 0;
  overflow: hidden;
  border: 1px solid #252936;
  border-radius: 20px;
  background:
    radial-gradient(circle at 85% 0%, rgba(124, 110, 244, 0.12), transparent 30%),
    #0e1016;
  box-shadow: 0 24px 60px rgba(7, 8, 12, 0.2);
  color: #f2f1ec;
}

.workflow-demo-tabs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;
  padding: 1rem 1rem 0;
}

.workflow-demo-tabs button {
  min-width: 0;
  min-height: 42px;
  padding: 0.65rem 0.7rem;
  border: 1px solid #303441;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.02);
  color: #a2a5ad;
  font: 600 0.78rem/1.25 var(--vp-font-family-base);
  cursor: pointer;
}

.workflow-demo-tabs button:hover {
  border-color: #7c6ef4;
  color: #f2f1ec;
}

.workflow-demo-tabs button[aria-pressed='true'] {
  border-color: #7c6ef4;
  background: rgba(124, 110, 244, 0.12);
  color: #b7b0f9;
  box-shadow: inset 0 0 0 1px rgba(124, 110, 244, 0.2);
}

.workflow-demo-panel {
  padding: 1.2rem 1.35rem 1.25rem;
}

.workflow-demo-badge {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  margin: 0 0 1rem;
  padding: 0.35rem 0.75rem;
  border: 1px solid #292d39;
  border-radius: 8px;
  background: #151821;
  color: #d6d5cf;
  font: 600 0.74rem/1 var(--vp-font-family-mono);
}

.workflow-demo-steps,
.workflow-demo-children {
  margin: 0;
  padding: 0;
  list-style: none;
}

.workflow-demo-steps > li {
  position: relative;
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  gap: 0.75rem;
  min-height: 58px;
  padding-bottom: 0.75rem;
}

.workflow-demo-steps > li:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 32px;
  bottom: 0;
  left: 16px;
  width: 2px;
  background: #303441;
}

.workflow-demo-steps > li.is-completed:not(:last-child)::after {
  background: rgba(34, 197, 94, 0.52);
}

.workflow-demo-marker {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: 2px solid #3a3e4b;
  border-radius: 999px;
  background: #12141b;
  color: #777b86;
  font: 700 0.82rem/1 var(--vp-font-family-mono);
}

.is-active > .workflow-demo-marker {
  border-color: #948af7;
  color: #d0cbff;
  box-shadow: 0 0 18px rgba(124, 110, 244, 0.35);
}

.is-completed > .workflow-demo-marker {
  border-color: #22c55e;
  background: #168d45;
  color: #fff;
}

.workflow-demo-step-copy {
  min-width: 0;
  padding-top: 0.1rem;
}

.workflow-demo-step-copy > strong {
  display: block;
  color: #f2f1ec;
  font-size: 0.93rem;
  line-height: 1.3;
}

.workflow-demo-step-copy > span {
  display: block;
  margin-top: 0.15rem;
  color: #777b86;
  font-size: 0.78rem;
  line-height: 1.4;
}

.is-active .workflow-demo-step-copy > span {
  color: #aaa5dd;
}

.workflow-demo-children {
  display: grid;
  gap: 0.55rem;
  margin-top: 0.75rem;
  padding: 0.8rem;
  border: 1px solid #292d39;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.018);
}

.workflow-demo-children li {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr);
  gap: 0.5rem;
  align-items: start;
}

.workflow-demo-child-marker {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  margin-top: 0.12rem;
  border-radius: 999px;
  background: rgba(124, 110, 244, 0.2);
  color: #a89ff8;
  font-size: 0.7rem;
}

.is-completed .workflow-demo-child-marker {
  background: rgba(34, 197, 94, 0.18);
  color: #6bd997;
}

.workflow-demo-children strong,
.workflow-demo-children small {
  display: block;
}

.workflow-demo-children strong {
  color: #e6e4dd;
  font-size: 0.78rem;
}

.workflow-demo-children small {
  margin-top: 0.1rem;
  overflow-wrap: anywhere;
  color: #777b86;
  font: 0.68rem/1.4 var(--vp-font-family-mono);
}

.workflow-demo-announcement {
  min-height: 2.7em;
  margin: 0.15rem 0 0.8rem;
  color: #a2a5ad;
  font-size: 0.78rem;
  line-height: 1.45;
}

.workflow-demo-action,
.workflow-demo-yaml-toggle {
  width: 100%;
  cursor: pointer;
}

.workflow-demo-action {
  min-height: 46px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: #6d5ce8;
  color: #fff;
  font: 700 0.88rem/1 var(--vp-font-family-base);
  box-shadow: 0 8px 28px rgba(109, 92, 232, 0.25);
}

.workflow-demo-action:hover {
  background: #7c6ef4;
}

.workflow-demo-yaml-toggle {
  min-height: 36px;
  margin-top: 0.35rem;
  border: 0;
  background: transparent;
  color: #a89ff8;
  font: 600 0.78rem/1 var(--vp-font-family-base);
}

.workflow-demo-yaml {
  margin-top: 0.5rem;
}

.workflow-demo-yaml pre {
  margin: 0;
  padding: 1rem;
  max-height: 340px;
  overflow: auto;
  border: 1px solid #292d39;
  border-radius: 10px;
  background: #0b0d12;
  color: #d6d5cf;
  font: 0.72rem/1.55 var(--vp-font-family-mono);
  text-align: left;
  white-space: pre;
}

button:focus-visible {
  outline: 3px solid rgba(183, 176, 249, 0.7);
  outline-offset: 2px;
}

@media (max-width: 720px) {
  .workflow-demo-tabs {
    grid-template-columns: 1fr;
  }

  .workflow-demo-tabs button {
    min-height: 38px;
  }
}

@media (max-width: 480px) {
  .workflow-demo {
    border-radius: 14px;
  }

  .workflow-demo-tabs {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.35rem;
    padding: 0.75rem 0.75rem 0;
  }

  .workflow-demo-tabs button {
    padding: 0.5rem 0.3rem;
    font-size: 0.68rem;
  }

  .workflow-demo-panel {
    padding: 1rem 0.9rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
