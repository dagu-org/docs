<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import aiYaml from './overview-workflows/ai.yaml?raw'
import controllerYaml from './overview-workflows/controller.yaml?raw'
import scheduledYaml from './overview-workflows/scheduled.yaml?raw'
import serversYaml from './overview-workflows/servers.yaml?raw'

function yamlDocument(source, index = 0) {
  return `${source.split('\n---\n')[index].trim()}\n`
}

const yamlSources = {
  scheduled: [
    { label: 'Parent · nightly-report', source: yamlDocument(scheduledYaml) },
    { label: 'Child · data-pipeline', source: yamlDocument(scheduledYaml, 1) },
  ],
  ai: [{ label: 'AI workflow · incident-fix', source: yamlDocument(aiYaml) }],
  servers: [
    { label: 'Parent · api-recovery', source: yamlDocument(serversYaml) },
    { label: 'Child · remote-recovery', source: yamlDocument(serversYaml, 1) },
  ],
  controller: [{ label: 'Agent Loop · code-review', source: `${controllerYaml.trim()}\n` }],
}

const controllerActions = [
  { id: 'review_correctness', icon: '⌕', label: 'Review correctness', meta: 'OpenCode' },
  { id: 'review_simplicity', icon: '≡', label: 'Review simplicity', meta: 'OpenCode' },
  { id: 'revise', icon: '✎', label: 'Revise', meta: 'Child workflow' },
]

const controllerTurns = [
  { action: 'review_correctness', result: 'FAIL · off-by-one error', status: 'failed' },
  { action: 'revise', result: 'Patch applied · child run #8297', status: 'succeeded' },
  { action: 'review_correctness', result: 'PASS · correctness verified', status: 'succeeded' },
  { action: 'review_simplicity', result: 'FAIL · unnecessary complexity', status: 'failed' },
  { action: 'revise', result: 'Patch applied · child run #8298', status: 'succeeded' },
  { action: 'review_correctness', result: 'PASS · current revision verified', status: 'succeeded' },
  { action: 'review_simplicity', result: 'PASS · simplicity verified', status: 'succeeded' },
]

const demos = [
  {
    id: 'scheduled',
    tab: 'Scheduled',
    kicker: 'Scheduled workflows',
    headline: ['Schedule it.', 'See every step.'],
    lead: 'Run containers, commands, and child workflows on time. Dagu shows the parent and every nested run as they happen.',
    runId: 'nightly-report · #8291',
    nodes: [
      { id: 'schedule', icon: '◷', label: '02:00', meta: 'Cron trigger' },
      { id: 'docker', icon: '⬡', label: 'Docker', meta: 'python:3.13' },
      { id: 'child', icon: '⌘', label: 'Child DAG', meta: 'data-pipeline' },
      { id: 'publish', icon: '›_', label: 'Publish', meta: 'Shell command' },
      { id: 'email', icon: '@', label: 'Email', meta: 'Notify ops' },
    ],
    phases: [
      { duration: 650, active: ['schedule'], done: [], event: 'Schedule fired at 02:00:00' },
      { duration: 950, active: ['docker'], done: ['schedule'], event: 'Starting python:3.13-slim' },
      { duration: 850, active: ['child', 'extract'], done: ['schedule', 'docker'], event: 'Child run #8292 started' },
      { duration: 850, active: ['child', 'transform'], done: ['schedule', 'docker', 'extract'], event: 'Transform running in Docker' },
      { duration: 750, active: ['child', 'validate'], done: ['schedule', 'docker', 'extract', 'transform'], event: 'Validating pipeline output' },
      { duration: 700, active: ['publish'], done: ['schedule', 'docker', 'child', 'extract', 'transform', 'validate'], event: 'Child run succeeded · parent resumed' },
      { duration: 700, active: ['email'], done: ['schedule', 'docker', 'child', 'extract', 'transform', 'validate', 'publish'], event: 'Sending completion email' },
      { active: [], done: ['schedule', 'docker', 'child', 'extract', 'transform', 'validate', 'publish', 'email'], event: 'All 8 steps succeeded', complete: true },
    ],
  },
  {
    id: 'ai',
    tab: 'Harness',
    kicker: 'Agent Harness',
    headline: ['AI takes action.', 'You stay in control.'],
    lead: 'Let OpenCode inspect logs, search the repository, and propose a fix. Dagu pauses before execution until a person approves it.',
    runId: 'incident-fix · #8293',
    nodes: [
      { id: 'collect', icon: '↧', label: 'Context', meta: 'Collect errors' },
      { id: 'opencode', icon: '✦', label: 'OpenCode', meta: 'Agent task' },
      { id: 'review', icon: '✓?', label: 'Human Task', meta: 'Approval gate' },
      { id: 'apply', icon: '›_', label: 'Apply fix', meta: 'Approved command' },
    ],
    phases: [
      { duration: 700, active: ['collect'], done: [], event: 'Collecting logs and runtime context' },
      { duration: 850, active: ['opencode'], done: ['collect'], event: 'OpenCode: reading error logs', agentAction: 0 },
      { duration: 850, active: ['opencode'], done: ['collect'], event: 'OpenCode: searching runtime code', agentAction: 1 },
      { duration: 950, active: ['opencode'], done: ['collect'], event: 'OpenCode: preparing a safe fix', agentAction: 2 },
      { active: [], done: ['collect', 'opencode'], waiting: ['review'], event: 'Waiting for human approval', approval: 'Approve & continue' },
      { duration: 850, active: ['apply'], done: ['collect', 'opencode', 'review'], event: 'Running the approved command' },
      { active: [], done: ['collect', 'opencode', 'review', 'apply'], event: 'Approved fix completed', complete: true },
    ],
  },
  {
    id: 'servers',
    tab: 'SSH Operations',
    kicker: 'Server operations',
    headline: ['Inspect. Approve.', 'Recover remotely.'],
    lead: 'Diagnose over SSH, wait for approval, hand recovery to a reusable child DAG, and email the on-call team when it succeeds.',
    runId: 'api-recovery · #8294',
    nodes: [
      { id: 'inspect', icon: 'SSH', label: 'Inspect', meta: 'systemctl --failed' },
      { id: 'review', icon: '✓?', label: 'Human Task', meta: 'Recovery approval' },
      { id: 'recovery', icon: '⌘', label: 'Recovery DAG', meta: 'remote-recovery' },
      { id: 'email', icon: '@', label: 'Email', meta: 'Notify on-call' },
    ],
    phases: [
      { duration: 950, active: ['inspect'], done: [], event: 'SSH connected · inspecting api.example.com' },
      { active: [], done: ['inspect'], waiting: ['review'], event: 'Failure found · waiting for approval', approval: 'Approve recovery' },
      { duration: 900, active: ['recovery', 'restart'], done: ['inspect', 'review'], event: 'Child run #8295 started · restarting over SSH' },
      { duration: 950, active: ['recovery', 'verify'], done: ['inspect', 'review', 'restart'], event: 'Verifying api.service over SSH' },
      { duration: 700, active: ['email'], done: ['inspect', 'review', 'recovery', 'restart', 'verify'], event: 'Child run succeeded · emailing on-call' },
      { active: [], done: ['inspect', 'review', 'recovery', 'restart', 'verify', 'email'], event: 'Remote recovery completed', complete: true },
    ],
  },
  {
    id: 'controller',
    tab: 'Agent Loop',
    kicker: 'Adaptive workflows',
    headline: ['Set the goal.', 'Let Dagu adapt.'],
    lead: 'Give Dagu reviewed actions and completion goals. It chooses one action per turn, observes the result, and keeps going until every task is settled.',
    runId: 'code-review · #8296',
    nodes: [],
    phases: [
      ...controllerTurns.map((turn, controllerTurn) => ({
        duration: 1050,
        active: [],
        done: [],
        controllerTurn,
        event: `${controllerActions.find((action) => action.id === turn.action).label} · ${turn.result}`,
      })),
      { active: [], done: [], event: 'Both review goals completed · agent loop stopped', complete: true },
    ],
  },
]

const orderedDemos = ['scheduled', 'servers', 'ai', 'controller']
  .map((id) => demos.find((item) => item.id === id))

const childNodes = [
  { id: 'extract', icon: '↧', label: 'Extract', meta: 'Python command' },
  { id: 'transform', icon: '⬡', label: 'Transform', meta: 'Docker step' },
  { id: 'validate', icon: '✓', label: 'Validate', meta: 'Shell command' },
]

const agentActions = [
  { icon: '▤', label: 'Read error logs' },
  { icon: '⌕', label: 'Search runtime code' },
  { icon: '✎', label: 'Propose safe fix' },
]

const recoveryChildNodes = [
  { id: 'restart', icon: 'SSH', label: 'SSH Restart', meta: 'systemctl restart api' },
  { id: 'verify', icon: 'SSH', label: 'SSH Verify', meta: 'systemctl is-active' },
]

const selectedId = ref('scheduled')
const phaseIndex = ref(-1)
const elapsed = ref(0)
const reduceMotion = ref(false)
const yamlDialog = ref()
const yamlIndex = ref(0)
const copyLabel = ref('Copy YAML')
let phaseTimer
let clockTimer
let startedAt
let copyTimer

const demo = computed(() => demos.find((item) => item.id === selectedId.value))
const phase = computed(() => demo.value.phases[phaseIndex.value])
const isController = computed(() => selectedId.value === 'controller')
const isWaiting = computed(() => Boolean(phase.value?.waiting?.length))
const isComplete = computed(() => Boolean(phase.value?.complete))
const isRunning = computed(() => phaseIndex.value >= 0 && !isWaiting.value && !isComplete.value)
const runStatus = computed(() => {
  if (phaseIndex.value < 0) return 'READY'
  if (isWaiting.value) return 'WAITING'
  if (isComplete.value) return 'SUCCEEDED'
  return 'RUNNING'
})
const eventText = computed(() => phase.value?.event ?? (isController.value
  ? 'Click Run to watch the agent loop choose approved actions'
  : 'Click Run to watch the graph execute'))
const actionLabel = computed(() => {
  if (phaseIndex.value < 0) return 'Run animated demo'
  if (isWaiting.value) return phase.value.approval
  if (isComplete.value) return 'Replay demo'
  return 'Running…'
})
const childVisible = computed(() => selectedId.value === 'scheduled' && nodeStatus('child') !== 'queued')
const childStatus = computed(() => nodeStatus('child'))
const agentActionIndex = computed(() => phase.value?.agentAction ?? (nodeStatus('opencode') === 'succeeded' ? agentActions.length : -1))
const agentVisible = computed(() => selectedId.value === 'ai' && nodeStatus('opencode') !== 'queued')
const remoteVisible = computed(() => selectedId.value === 'servers' && isWaiting.value)
const recoveryVisible = computed(() => selectedId.value === 'servers' && nodeStatus('recovery') !== 'queued')
const recoveryStatus = computed(() => nodeStatus('recovery'))
const controllerTurn = computed(() => phase.value?.controllerTurn === undefined
  ? undefined
  : controllerTurns[phase.value.controllerTurn])
const selectedControllerAction = computed(() => controllerActions.find((action) => action.id === controllerTurn.value?.action))
const controllerHistory = computed(() => {
  const turns = isComplete.value
    ? controllerTurns.slice(-3)
    : phase.value?.controllerTurn === undefined
      ? []
      : controllerTurns.slice(Math.max(0, phase.value.controllerTurn - 2), phase.value.controllerTurn + 1)
  return turns.map((turn) => ({
    ...turn,
    definition: controllerActions.find((action) => action.id === turn.action),
  }))
})
const yamlDocuments = computed(() => yamlSources[selectedId.value])
const selectedYaml = computed(() => yamlDocuments.value[yamlIndex.value])
const yamlLines = computed(() => selectedYaml.value.source.split('\n'))

function captureOverviewEvent(event, properties = {}) {
  window.posthog?.capture?.(event, {
    surface: 'docs',
    page: 'overview',
    component: 'workflow_demo',
    scenario: selectedId.value,
    ...properties,
  })
}

function yamlDocumentRole(index = yamlIndex.value) {
  if (yamlDocuments.value.length === 1) return 'workflow'
  return index === 0 ? 'parent' : 'child'
}

function stopTimers() {
  clearTimeout(phaseTimer)
  clearInterval(clockTimer)
  clearTimeout(copyTimer)
}

function resetRun() {
  stopTimers()
  phaseIndex.value = -1
  elapsed.value = 0
  startedAt = undefined
}

function selectDemo(id) {
  const previousScenario = selectedId.value
  resetRun()
  yamlIndex.value = 0
  copyLabel.value = 'Copy YAML'
  selectedId.value = id
  captureOverviewEvent('overview_demo_scenario_selected', {
    previous_scenario: previousScenario,
  })
}

function openYaml() {
  yamlIndex.value = 0
  copyLabel.value = 'Copy YAML'
  yamlDialog.value.showModal()
  captureOverviewEvent('overview_demo_yaml_opened', {
    document_count: yamlDocuments.value.length,
  })
}

function selectYaml(index) {
  yamlIndex.value = index
  copyLabel.value = 'Copy YAML'
  captureOverviewEvent('overview_demo_yaml_document_selected', {
    document_role: yamlDocumentRole(index),
  })
}

async function copyYaml() {
  try {
    await navigator.clipboard.writeText(selectedYaml.value.source)
    copyLabel.value = 'Copied!'
    captureOverviewEvent('overview_demo_yaml_copied', {
      document_role: yamlDocumentRole(),
    })
  } catch {
    copyLabel.value = 'Copy failed'
    captureOverviewEvent('overview_demo_yaml_copy_failed', {
      document_role: yamlDocumentRole(),
    })
  }
  clearTimeout(copyTimer)
  copyTimer = setTimeout(() => { copyLabel.value = 'Copy YAML' }, 1800)
}

function startClock() {
  startedAt = Date.now()
  clockTimer = setInterval(() => {
    elapsed.value = (Date.now() - startedAt) / 1000
  }, 100)
}

function showPhase(index) {
  phaseIndex.value = index
  const next = demo.value.phases[index]
  if (next.complete) {
    elapsed.value = (Date.now() - startedAt) / 1000
    clearInterval(clockTimer)
    captureOverviewEvent('overview_demo_run_completed', {
      elapsed_seconds: Number(elapsed.value.toFixed(1)),
    })
    return
  }
  if (!next.waiting?.length) {
    phaseTimer = setTimeout(() => showPhase(index + 1), reduceMotion.value ? 120 : next.duration)
  }
}

function runDemo() {
  if (phaseIndex.value < 0 || isComplete.value) {
    captureOverviewEvent('overview_demo_run_started', {
      mode: isComplete.value ? 'replay' : 'initial',
    })
    resetRun()
    startClock()
    showPhase(0)
    return
  }
  if (isWaiting.value) {
    captureOverviewEvent('overview_demo_human_task_approved', {
      step: phase.value.waiting[0],
    })
    showPhase(phaseIndex.value + 1)
  }
}

function nodeStatus(id) {
  if (!phase.value) return 'queued'
  if (phase.value.waiting?.includes(id)) return 'waiting'
  if (phase.value.active.includes(id)) return 'running'
  if (phase.value.done.includes(id)) return 'succeeded'
  return 'queued'
}

function edgeStatus(from, to) {
  const target = nodeStatus(to)
  if (target === 'succeeded') return 'succeeded'
  if (target === 'running' || target === 'waiting') return 'active'
  if (nodeStatus(from) === 'succeeded') return 'ready'
  return 'queued'
}

function statusLabel(status) {
  return status.toUpperCase()
}

onMounted(() => {
  reduceMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
})

onBeforeUnmount(stopTimers)
</script>

<template>
  <div class="overview-landing">
    <Transition name="hero-copy" mode="out-in">
      <section :key="demo.id" class="overview-landing-copy">
        <p class="overview-kicker">{{ demo.kicker }}</p>
        <h1>{{ demo.headline[0] }}<br>{{ demo.headline[1] }}</h1>
        <p class="overview-landing-lead">{{ demo.lead }}</p>
        <div class="overview-actions">
          <a href="#run-your-first-workflow" class="overview-button overview-button-primary" @click="captureOverviewEvent('overview_demo_cta_clicked', { cta: 'quickstart' })">Start in 5 minutes</a>
          <a href="https://dagu-demo-f5e33d0e.dagu.sh/" class="overview-button overview-button-secondary" @click="captureOverviewEvent('overview_demo_cta_clicked', { cta: 'live_demo' })">Try the Live Demo</a>
        </div>
        <p class="overview-demo-login"><span>Demo login</span><code>demouser / demouser</code></p>
      </section>
    </Transition>

    <section class="workflow-demo" aria-label="Animated Dagu workflow run">
      <div class="workflow-tabs" role="group" aria-label="Choose a workflow scenario">
        <button
          v-for="item in orderedDemos"
          :key="item.id"
          type="button"
          :aria-pressed="selectedId === item.id"
          @click="selectDemo(item.id)"
        >
          {{ item.tab }}
        </button>
      </div>

      <div class="run-toolbar">
        <div>
          <span class="run-label">{{ isController ? 'AGENT LOOP RUN' : 'DAG RUN' }}</span>
          <strong>{{ demo.runId }}</strong>
        </div>
        <div class="run-toolbar-tools">
          <button class="yaml-open" type="button" @click="openYaml">
            <span aria-hidden="true">&lt;/&gt;</span> View YAML
          </button>
          <div class="run-state" :class="`is-${runStatus.toLowerCase()}`">
            <i aria-hidden="true"></i>{{ runStatus }}<span>{{ elapsed.toFixed(1) }}s</span>
          </div>
        </div>
      </div>

      <dialog ref="yamlDialog" class="yaml-dialog">
        <header class="yaml-dialog-header">
          <div>
            <strong>{{ demo.tab }} workflow</strong>
            <span>Validated Dagu YAML</span>
          </div>
          <form method="dialog">
            <button type="submit" aria-label="Close YAML viewer">×</button>
          </form>
        </header>

        <div v-if="yamlDocuments.length > 1" class="yaml-document-tabs" role="tablist" aria-label="Workflow YAML documents">
          <button
            v-for="(document, index) in yamlDocuments"
            :key="document.label"
            type="button"
            role="tab"
            :aria-selected="yamlIndex === index"
            @click="selectYaml(index)"
          >
            {{ document.label }}
          </button>
        </div>

        <pre class="yaml-code" tabindex="0"><code><span v-for="(line, index) in yamlLines" :key="index" class="yaml-code-line">{{ line || ' ' }}</span></code></pre>

        <aside class="yaml-ai-callout">
          <span class="yaml-ai-icon" aria-hidden="true">✦</span>
          <div>
            <strong>Let AI build it</strong>
            <p>Connect an AI agent or chat app to Dagu through MCP, then ask it to create or edit this workflow.</p>
          </div>
          <a href="/mcp/quickstart" @click="captureOverviewEvent('overview_demo_mcp_clicked', { source: 'yaml_viewer' })">Set up MCP <span aria-hidden="true">→</span></a>
        </aside>

        <footer class="yaml-dialog-footer">
          <span>Copy this workflow and run it with Dagu.</span>
          <button type="button" @click="copyYaml">{{ copyLabel }}</button>
        </footer>
      </dialog>

      <div class="run-canvas" :class="`canvas-${demo.id}`" :aria-label="isController ? 'Live agent loop' : 'Live workflow graph'">
        <template v-if="isController">
          <div class="controller-topline">
            <section class="controller-tasks" aria-label="Agent loop tasks">
              <header><span>TASKS</span><b>Completion goals</b></header>
              <div>
                <article :class="{ 'is-complete': isComplete }">
                  <i aria-hidden="true">{{ isComplete ? '✓' : '○' }}</i>
                  <strong>Correctness passed</strong>
                  <em>{{ isComplete ? 'COMPLETE' : 'OPEN' }}</em>
                </article>
                <article :class="{ 'is-complete': isComplete }">
                  <i aria-hidden="true">{{ isComplete ? '✓' : '○' }}</i>
                  <strong>Simplicity passed</strong>
                  <em>{{ isComplete ? 'COMPLETE' : 'OPEN' }}</em>
                </article>
              </div>
            </section>

            <section class="controller-catalog" aria-label="Approved action catalog">
              <header><span>APPROVED ACTIONS</span><b>3 available</b></header>
              <div>
                <article
                  v-for="action in controllerActions"
                  :key="action.id"
                  :class="{ 'is-selected': controllerTurn?.action === action.id && !isComplete }"
                >
                  <i aria-hidden="true">{{ action.icon }}</i>
                  <span><strong>{{ action.label }}</strong><small>{{ action.meta }}</small></span>
                  <em v-if="controllerTurn?.action === action.id && !isComplete">SELECTED</em>
                </article>
              </div>
            </section>
          </div>

          <section class="controller-loop" :class="{ 'is-active': isRunning, 'is-complete': isComplete }" aria-label="Choose, run, observe, and update loop">
            <span class="controller-loop-track" aria-hidden="true"></span>
            <div class="controller-stage stage-choose"><i aria-hidden="true">◆</i><span><b>CHOOSE</b><small>Pick one action</small></span></div>
            <div class="controller-stage stage-run"><i aria-hidden="true">▶</i><span><b>RUN</b><small>Execute safely</small></span></div>
            <div class="controller-stage stage-observe"><i aria-hidden="true">◉</i><span><b>OBSERVE</b><small>Read the result</small></span></div>
            <div class="controller-stage stage-update"><i aria-hidden="true">↻</i><span><b>UPDATE</b><small>Check the goals</small></span></div>

            <div class="controller-core">
              <span>AGENT LOOP</span>
              <strong>{{ isComplete ? 'DONE' : phase?.controllerTurn === undefined ? 'READY' : `TURN ${phase.controllerTurn + 1}` }}</strong>
            </div>

            <Transition name="controller-card" mode="out-in">
              <article v-if="selectedControllerAction && !isComplete" :key="`${phase.controllerTurn}-${selectedControllerAction.id}`" class="controller-selected-action">
                <i aria-hidden="true">{{ selectedControllerAction.icon }}</i>
                <span><strong>{{ selectedControllerAction.label }}</strong><small>{{ selectedControllerAction.meta }}</small></span>
              </article>
            </Transition>

            <Transition name="controller-result" mode="out-in">
              <p v-if="controllerTurn && !isComplete" :key="`${phase.controllerTurn}-${controllerTurn.result}`" class="controller-observation" :class="`is-${controllerTurn.status}`">
                <span>OBSERVATION</span><strong>{{ controllerTurn.result }}</strong>
              </p>
            </Transition>
          </section>

          <section class="controller-history" aria-label="Recent agent loop turns">
            <header>RECENT TURNS</header>
            <div v-if="controllerHistory.length">
              <article v-for="turn in controllerHistory" :key="`${turn.action}-${turn.result}`" :class="`is-${turn.status}`">
                <i aria-hidden="true">{{ turn.definition.icon }}</i>
                <span><strong>{{ turn.definition.label }}</strong><small>{{ turn.result }}</small></span>
              </article>
            </div>
            <p v-else>Run the demo to watch decisions appear here.</p>
          </section>
        </template>

        <template v-else>
        <div class="dag-flow">
          <template v-for="(node, index) in demo.nodes" :key="node.id">
            <article class="dag-node" :class="`is-${nodeStatus(node.id)}`">
              <div class="node-heading">
                <span class="node-icon" aria-hidden="true">{{ node.icon }}</span>
                <span class="node-status"><i aria-hidden="true"></i>{{ statusLabel(nodeStatus(node.id)) }}</span>
              </div>
              <strong>{{ node.label }}</strong>
              <small>{{ node.meta }}</small>
            </article>
            <span
              v-if="index < demo.nodes.length - 1"
              class="dag-edge"
              :class="`is-${edgeStatus(node.id, demo.nodes[index + 1].id)}`"
              aria-hidden="true"
            ><i></i></span>
          </template>
        </div>

        <Transition name="nested-run">
          <section v-if="childVisible" class="child-run" aria-label="data-pipeline child DAG run">
            <header>
              <span><b>CHILD RUN</b>data-pipeline · #8292</span>
              <em :class="`is-${childStatus}`"><i aria-hidden="true"></i>{{ statusLabel(childStatus) }}</em>
            </header>
            <div class="dag-flow child-flow">
              <template v-for="(node, index) in childNodes" :key="node.id">
                <article class="dag-node" :class="`is-${nodeStatus(node.id)}`">
                  <div class="node-heading">
                    <span class="node-icon" aria-hidden="true">{{ node.icon }}</span>
                    <span class="node-status"><i aria-hidden="true"></i>{{ statusLabel(nodeStatus(node.id)) }}</span>
                  </div>
                  <strong>{{ node.label }}</strong>
                  <small>{{ node.meta }}</small>
                </article>
                <span
                  v-if="index < childNodes.length - 1"
                  class="dag-edge"
                  :class="`is-${edgeStatus(node.id, childNodes[index + 1].id)}`"
                  aria-hidden="true"
                ><i></i></span>
              </template>
            </div>
          </section>
        </Transition>

        <Transition name="nested-run">
          <section v-if="agentVisible" class="agent-run" aria-label="OpenCode task activity">
            <div class="agent-prompt">
              <span class="agent-mark" aria-hidden="true">✦</span>
              <span><b>OPENCODE TASK</b>Find the cause and propose a safe fix</span>
            </div>
            <div class="agent-actions">
              <span
                v-for="(action, index) in agentActions"
                :key="action.label"
                :class="{
                  'is-running': index === agentActionIndex,
                  'is-succeeded': index < agentActionIndex,
                }"
              ><i aria-hidden="true">{{ index < agentActionIndex ? '✓' : action.icon }}</i>{{ action.label }}</span>
            </div>
          </section>
        </Transition>

        <Transition name="nested-run">
          <section v-if="remoteVisible" class="remote-run" aria-label="Remote host diagnosis result">
            <header><b>REMOTE HOST</b><strong>api.example.com</strong></header>
            <div class="remote-results">
              <span class="is-good"><i aria-hidden="true">✓</i><b>Connection</b><em>Connected</em></span>
              <span class="is-bad"><i aria-hidden="true">×</i><b>api.service</b><em>Inactive</em></span>
              <span class="is-bad"><i aria-hidden="true">!</i><b>Last exit</b><em>code 1</em></span>
            </div>
          </section>
        </Transition>

        <Transition name="nested-run">
          <section v-if="recoveryVisible" class="child-run is-recovery" aria-label="remote-recovery child DAG run">
            <header>
              <span><b>CHILD RUN</b>remote-recovery · #8295</span>
              <em :class="`is-${recoveryStatus}`"><i aria-hidden="true"></i>{{ statusLabel(recoveryStatus) }}</em>
            </header>
            <div class="dag-flow child-flow">
              <template v-for="(node, index) in recoveryChildNodes" :key="node.id">
                <article class="dag-node" :class="`is-${nodeStatus(node.id)}`">
                  <div class="node-heading">
                    <span class="node-icon" aria-hidden="true">{{ node.icon }}</span>
                    <span class="node-status"><i aria-hidden="true"></i>{{ statusLabel(nodeStatus(node.id)) }}</span>
                  </div>
                  <strong>{{ node.label }}</strong>
                  <small>{{ node.meta }}</small>
                </article>
                <span
                  v-if="index < recoveryChildNodes.length - 1"
                  class="dag-edge"
                  :class="`is-${edgeStatus(node.id, recoveryChildNodes[index + 1].id)}`"
                  aria-hidden="true"
                ><i></i></span>
              </template>
            </div>
          </section>
        </Transition>
        </template>
      </div>

      <div class="run-footer">
        <p aria-live="polite">
          <span class="event-icon" aria-hidden="true">⌁</span>
          <span><b>EVENT</b>{{ eventText }}</span>
        </p>
        <button type="button" :disabled="isRunning" @click="runDemo">
          <span v-if="isRunning" class="button-spinner" aria-hidden="true"></span>
          <span v-else aria-hidden="true">{{ isWaiting ? '✓' : '▶' }}</span>
          {{ actionLabel }}
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.workflow-demo {
  min-width: 0;
  overflow: hidden;
  border: 1px solid #2c3140;
  border-radius: 20px;
  background: #0d1017;
  box-shadow: 0 28px 70px rgba(7, 8, 12, 0.25);
  color: #f3f4f6;
}

.workflow-tabs {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0;
  padding: 0 12px;
  border-bottom: 1px solid #252a37;
  background: #11151e;
}

.workflow-tabs button {
  min-height: 48px;
  padding: 0.5rem;
  border: 0;
  border-bottom: 2px solid transparent;
  border-radius: 0;
  background: transparent;
  color: #7f8796;
  font: 650 0.73rem/1.2 var(--vp-font-family-base);
  cursor: pointer;
}

.workflow-tabs button:hover {
  color: #e5e7eb;
  background: #191e29;
}

.workflow-tabs button[aria-pressed='true'] {
  border-bottom-color: #8a7cf7;
  background: linear-gradient(180deg, rgba(109, 92, 232, 0.16), transparent);
  color: #f3f4f6;
  box-shadow: inset 0 -8px 18px rgba(109, 92, 232, 0.07);
}

.run-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  min-height: 62px;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #252a37;
}

.run-toolbar > div:first-child {
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  min-width: 0;
  gap: 0.28rem;
}

.run-label {
  padding: 0;
  color: #8e96a7;
  font: 700 0.58rem/1 var(--vp-font-family-mono);
  letter-spacing: 0.08em;
}

.run-toolbar strong {
  overflow: hidden;
  color: #d9dce3;
  font: 650 0.82rem/1.2 var(--vp-font-family-mono);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.run-toolbar-tools {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.yaml-open {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  min-height: 32px;
  padding: 0.45rem 0.65rem;
  border: 1px solid #383e4e;
  border-radius: 7px;
  background: #171b24;
  color: #c8ccd5;
  font: 650 0.65rem/1 var(--vp-font-family-base);
  cursor: pointer;
}

.yaml-open:hover {
  border-color: #7165d7;
  background: #202532;
  color: #fff;
}

.yaml-open span {
  color: #a79efa;
  font: 700 0.66rem/1 var(--vp-font-family-mono);
}

.run-state {
  display: inline-flex;
  align-items: center;
  gap: 0.42rem;
  flex: 0 0 auto;
  color: #8e96a7;
  font: 700 0.63rem/1 var(--vp-font-family-mono);
}

.run-state > i,
.node-status > i,
.child-run em > i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #697180;
}

.run-state span {
  color: #697180;
  font-weight: 500;
}

.run-state.is-running,
.run-state.is-succeeded {
  color: #65dc94;
}

.run-state.is-running > i,
.run-state.is-succeeded > i {
  background: #33ce74;
  box-shadow: 0 0 10px rgba(51, 206, 116, 0.55);
}

.run-state.is-running > i {
  animation: status-pulse 1.1s ease-in-out infinite;
}

.run-state.is-waiting {
  color: #ffbf5c;
}

.run-state.is-waiting > i {
  background: #ffad33;
  box-shadow: 0 0 10px rgba(255, 173, 51, 0.45);
}

.yaml-dialog {
  width: min(760px, calc(100vw - 32px));
  max-width: none;
  max-height: min(660px, calc(100vh - 48px));
  margin: auto;
  padding: 0;
  overflow: hidden;
  border: 1px solid #41485a;
  border-radius: 14px;
  background: #10141c;
  color: #f3f4f6;
  box-shadow: 0 30px 90px rgba(0, 0, 0, 0.62);
}

.yaml-dialog::backdrop {
  background: rgba(4, 6, 10, 0.78);
  backdrop-filter: blur(2px);
}

.yaml-dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.1rem 0.9rem;
  border-bottom: 1px solid #2c3240;
}

.yaml-dialog-header strong,
.yaml-dialog-header span {
  display: block;
}

.yaml-dialog-header strong {
  color: #f2f3f7;
  font-size: 1rem;
}

.yaml-dialog-header span {
  margin-top: 0.25rem;
  color: #8e96a7;
  font-size: 0.72rem;
}

.yaml-dialog-header form {
  margin: 0;
}

.yaml-dialog-header button {
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: #8e96a7;
  font: 400 1.4rem/1 var(--vp-font-family-base);
  cursor: pointer;
}

.yaml-dialog-header button:hover {
  background: #202632;
  color: #fff;
}

.yaml-document-tabs {
  display: flex;
  gap: 0;
  padding: 0 1.1rem;
  border-bottom: 1px solid #2c3240;
}

.yaml-document-tabs button {
  min-height: 42px;
  padding: 0.6rem 0.9rem;
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: #7f8796;
  font: 650 0.7rem/1.2 var(--vp-font-family-base);
  cursor: pointer;
}

.yaml-document-tabs button[aria-selected='true'] {
  border-bottom-color: #8a7cf7;
  color: #d8d4ff;
  background: rgba(109, 92, 232, 0.08);
}

.yaml-code {
  counter-reset: yaml-line;
  height: min(370px, calc(100vh - 335px));
  min-height: 220px;
  margin: 0;
  padding: 0.9rem 0;
  overflow: auto;
  background:
    linear-gradient(90deg, #0c0f16 0, #0c0f16 54px, #151924 54px, #151924 55px, #10141c 55px);
  color: #d6d2fa;
  font: 0.72rem/1.65 var(--vp-font-family-mono);
  text-align: left;
  tab-size: 2;
}

.yaml-code code {
  display: block;
  min-width: max-content;
}

.yaml-code-line {
  display: block;
  min-height: 1.65em;
  padding: 0 1.1rem 0 68px;
  white-space: pre;
  counter-increment: yaml-line;
}

.yaml-code-line::before {
  content: counter(yaml-line);
  display: inline-block;
  width: 36px;
  margin-left: -54px;
  margin-right: 18px;
  color: #596172;
  text-align: right;
}

.yaml-ai-callout {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.7rem;
  margin: 0.55rem 1.1rem;
  padding: 0.7rem 0.8rem;
  border: 1px solid rgba(138, 124, 247, 0.36);
  border-radius: 9px;
  background: linear-gradient(90deg, rgba(109, 92, 232, 0.12), rgba(109, 92, 232, 0.04));
}

.yaml-ai-icon {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  color: #9d8fff;
  font-size: 1.1rem;
}

.yaml-ai-callout strong {
  display: block;
  color: #f2f3f7;
  font-size: 0.72rem;
}

.yaml-ai-callout p {
  margin: 0.2rem 0 0;
  color: #929aac;
  font-size: 0.64rem;
  line-height: 1.45;
}

.yaml-ai-callout > a {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  min-height: 32px;
  padding: 0.4rem 0.65rem;
  border: 1px solid rgba(138, 124, 247, 0.66);
  border-radius: 7px;
  color: #b7adff;
  font-size: 0.65rem;
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
}

.yaml-ai-callout > a:hover {
  border-color: #9d8fff;
  background: rgba(109, 92, 232, 0.12);
  color: #d8d4ff;
}

.yaml-dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.8rem 1.1rem;
  border-top: 1px solid #2c3240;
  background: #121720;
}

.yaml-dialog-footer span {
  color: #8e96a7;
  font-size: 0.7rem;
}

.yaml-dialog-footer button {
  min-width: 102px;
  min-height: 34px;
  padding: 0.45rem 0.75rem;
  border: 1px solid #8477ed;
  border-radius: 7px;
  background: #6d5ce8;
  color: #fff;
  font: 700 0.68rem/1 var(--vp-font-family-base);
  cursor: pointer;
}

.yaml-dialog-footer button:hover {
  background: #7c6ef4;
}

.run-canvas {
  position: relative;
  min-height: 325px;
  padding: 1.35rem 1.15rem 1.15rem;
  overflow-x: auto;
  background:
    linear-gradient(rgba(49, 55, 71, 0.22) 1px, transparent 1px),
    linear-gradient(90deg, rgba(49, 55, 71, 0.22) 1px, transparent 1px),
    radial-gradient(circle at 50% 0%, rgba(109, 92, 232, 0.1), transparent 40%);
  background-size: 24px 24px, 24px 24px, auto;
}

.dag-flow {
  display: flex;
  align-items: stretch;
  min-width: 610px;
}

.canvas-ai .dag-flow,
.canvas-servers .dag-flow {
  min-width: 520px;
}

.dag-node {
  position: relative;
  flex: 1 1 0;
  min-width: 0;
  min-height: 104px;
  padding: 0.75rem;
  border: 1px solid #323847;
  border-radius: 10px;
  background: linear-gradient(145deg, #171b25, #121620);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.18);
  transition: border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease;
}

.dag-node.is-running {
  border-color: #8a7cf7;
  box-shadow: 0 0 0 1px rgba(138, 124, 247, 0.22), 0 0 28px rgba(109, 92, 232, 0.22);
  transform: translateY(-2px);
}

.dag-node.is-waiting {
  border-color: #d99026;
  box-shadow: 0 0 0 1px rgba(217, 144, 38, 0.2), 0 0 24px rgba(217, 144, 38, 0.15);
}

.dag-node.is-succeeded {
  border-color: #268f52;
  background: linear-gradient(145deg, rgba(34, 99, 61, 0.38), #121a19);
}

.node-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.3rem;
  margin-bottom: 0.6rem;
}

.node-icon {
  color: #a79efa;
  font: 700 0.75rem/1 var(--vp-font-family-mono);
}

.node-status {
  display: inline-flex;
  align-items: center;
  gap: 0.28rem;
  color: #626a79;
  font: 600 0.55rem/1 var(--vp-font-family-mono);
}

.node-status > i {
  width: 5px;
  height: 5px;
}

.is-running .node-status {
  color: #b6affb;
}

.is-running .node-status > i {
  background: #8a7cf7;
  box-shadow: 0 0 8px rgba(138, 124, 247, 0.75);
  animation: status-pulse 0.9s ease-in-out infinite;
}

.is-waiting .node-status {
  color: #ffc368;
}

.is-waiting .node-status > i {
  background: #ffad33;
}

.is-succeeded .node-status {
  color: #71dfa0;
}

.is-succeeded .node-status > i {
  background: #33ce74;
}

.dag-node > strong,
.dag-node > small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dag-node > strong {
  color: #e8eaf0;
  font-size: 0.8rem;
  line-height: 1.3;
}

.dag-node > small {
  margin-top: 0.18rem;
  color: #697180;
  font: 0.6rem/1.35 var(--vp-font-family-mono);
}

.dag-edge {
  position: relative;
  flex: 0 0 25px;
  align-self: center;
  height: 2px;
  overflow: hidden;
  background: #353b49;
}

.dag-edge::after {
  content: '';
  position: absolute;
  top: -3px;
  right: 0;
  border-top: 4px solid transparent;
  border-bottom: 4px solid transparent;
  border-left: 5px solid #4a5263;
}

.dag-edge.is-ready {
  background: #596173;
}

.dag-edge.is-active,
.dag-edge.is-succeeded {
  background: #6d5ce8;
}

.dag-edge.is-active::after,
.dag-edge.is-succeeded::after {
  border-left-color: #8a7cf7;
}

.dag-edge.is-succeeded {
  background: #28975a;
}

.dag-edge.is-succeeded::after {
  border-left-color: #33ce74;
}

.dag-edge.is-active i {
  position: absolute;
  inset: 0;
  width: 45%;
  background: linear-gradient(90deg, transparent, #c2bcff, transparent);
  animation: edge-travel 0.85s linear infinite;
}

.child-run {
  position: relative;
  min-width: 610px;
  margin-top: 1.4rem;
  padding: 0.75rem;
  border: 1px solid #3d4560;
  border-radius: 12px;
  background: rgba(15, 18, 27, 0.94);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.22);
}

.child-run::before {
  content: '';
  position: absolute;
  top: -1.45rem;
  left: 50%;
  height: 1.45rem;
  border-left: 2px dashed #6255c8;
}

.child-run.is-recovery {
  min-width: 520px;
}

.child-run.is-recovery::before {
  left: 62.5%;
}

.child-run header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.7rem;
  padding-bottom: 0.6rem;
  border-bottom: 1px solid #292f3d;
  color: #b7bdc9;
  font: 600 0.66rem/1 var(--vp-font-family-mono);
}

.child-run header span,
.child-run header em {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.child-run header b {
  padding: 0.26rem 0.4rem;
  border-radius: 4px;
  background: rgba(109, 92, 232, 0.18);
  color: #aaa1fb;
  font-size: 0.54rem;
  letter-spacing: 0.08em;
}

.child-run header em {
  color: #9fa6b4;
  font-style: normal;
}

.child-run header em.is-running,
.child-run header em.is-succeeded {
  color: #65dc94;
}

.child-run header em.is-running i,
.child-run header em.is-succeeded i {
  background: #33ce74;
}

.child-flow {
  min-width: 0;
}

.child-flow .dag-node {
  min-height: 84px;
}

.agent-run {
  position: relative;
  min-width: 520px;
  margin-top: 1.4rem;
  padding: 0.85rem;
  border: 1px solid #323847;
  border-radius: 12px;
  background: rgba(15, 18, 27, 0.9);
}

.agent-run::before {
  content: '';
  position: absolute;
  top: -1.45rem;
  left: 36%;
  height: 1.45rem;
  border-left: 2px solid #6255c8;
}

.agent-prompt {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  color: #8b93a2;
  font-size: 0.67rem;
}

.agent-prompt span:last-child,
.agent-prompt b {
  display: block;
}

.agent-prompt b {
  margin-bottom: 0.12rem;
  color: #a79efa;
  font: 700 0.62rem/1 var(--vp-font-family-mono);
  letter-spacing: 0.04em;
}

.agent-mark {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: rgba(109, 92, 232, 0.18);
  color: #a79efa;
  font-size: 1rem;
}

.agent-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.45rem;
  margin-top: 0.75rem;
}

.agent-actions span {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
  min-height: 54px;
  padding: 0.65rem;
  border: 1px solid #2f3543;
  border-radius: 7px;
  color: #626a79;
  font: 600 0.62rem/1.25 var(--vp-font-family-mono);
  transition: all 180ms ease;
}

.agent-actions i {
  color: #747d8e;
  font-style: normal;
}

.agent-actions span.is-running {
  border-color: #7c6ef4;
  background: rgba(109, 92, 232, 0.13);
  color: #c1bcf8;
  box-shadow: 0 0 18px rgba(109, 92, 232, 0.17);
  animation: agent-breathe 1.1s ease-in-out infinite;
}

.agent-actions span.is-succeeded {
  border-color: #267c4a;
  color: #69d998;
}

.agent-actions span.is-succeeded i {
  color: #33ce74;
}

.remote-run {
  position: relative;
  width: min(290px, 56%);
  min-width: 250px;
  margin-top: 1.4rem;
  padding: 0.8rem;
  border: 1px solid #323847;
  border-radius: 12px;
  background: rgba(15, 18, 27, 0.94);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.22);
}

.remote-run::before {
  content: '';
  position: absolute;
  top: -1.45rem;
  left: 24%;
  height: 1.45rem;
  border-left: 2px solid #2e9a5d;
}

.remote-run header {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  margin-bottom: 0.65rem;
}

.remote-run header b {
  color: #a79efa;
  font: 700 0.58rem/1 var(--vp-font-family-mono);
  letter-spacing: 0.05em;
}

.remote-run header strong {
  color: #e3e5eb;
  font-size: 0.72rem;
}

.remote-results {
  overflow: hidden;
  border: 1px solid #303645;
  border-radius: 8px;
}

.remote-results span {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr) auto;
  gap: 0.45rem;
  align-items: center;
  min-height: 32px;
  padding: 0.35rem 0.55rem;
  color: #9ba2af;
  font: 0.61rem/1.2 var(--vp-font-family-mono);
}

.remote-results span + span {
  border-top: 1px solid #303645;
}

.remote-results i {
  display: grid;
  place-items: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #55606f;
  color: #10141b;
  font-style: normal;
  font-weight: 900;
}

.remote-results b {
  color: #d4d7de;
  font-weight: 600;
}

.remote-results em {
  font-style: normal;
}

.remote-results .is-good i {
  background: #58cf85;
}

.remote-results .is-good em {
  color: #65dc94;
}

.remote-results .is-bad i {
  background: #ed605c;
  color: #fff;
}

.remote-results .is-bad em {
  color: #f07773;
}

.canvas-controller {
  min-height: 610px;
  padding: 1rem;
  overflow: hidden;
}

.controller-topline {
  display: grid;
  grid-template-columns: minmax(190px, 0.8fr) minmax(330px, 1.4fr);
  gap: 0.8rem;
  min-width: 560px;
}

.controller-tasks,
.controller-catalog,
.controller-history {
  min-width: 0;
}

.controller-tasks > header,
.controller-catalog > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.45rem;
  color: #7f8796;
  font: 700 0.55rem/1 var(--vp-font-family-mono);
  letter-spacing: 0.06em;
}

.controller-tasks > header b,
.controller-catalog > header b {
  color: #5f6878;
  font-weight: 500;
  letter-spacing: 0;
}

.controller-tasks > div,
.controller-catalog > div {
  display: grid;
  gap: 0.45rem;
}

.controller-catalog > div {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.controller-tasks article,
.controller-catalog article {
  min-width: 0;
  border: 1px solid #323847;
  border-radius: 9px;
  background: rgba(18, 22, 32, 0.94);
}

.controller-tasks article {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.45rem;
  min-height: 48px;
  padding: 0.55rem 0.65rem;
}

.controller-tasks article > i {
  color: #7d8797;
  font: normal 700 0.9rem/1 var(--vp-font-family-mono);
}

.controller-tasks article > strong {
  overflow: hidden;
  color: #d9dce4;
  font-size: 0.66rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.controller-tasks article > em {
  color: #697180;
  font: normal 700 0.49rem/1 var(--vp-font-family-mono);
}

.controller-tasks article.is-complete {
  border-color: #268f52;
  background: rgba(27, 89, 53, 0.22);
}

.controller-tasks article.is-complete > i,
.controller-tasks article.is-complete > em {
  color: #65dc94;
}

.controller-catalog article {
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 0.45rem;
  min-height: 76px;
  padding: 0.55rem;
  transition: border-color 180ms ease, background-color 180ms ease, box-shadow 180ms ease;
}

.controller-catalog article > i,
.controller-history article > i,
.controller-selected-action > i {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border-radius: 7px;
  background: rgba(109, 92, 232, 0.2);
  color: #b3aaff;
  font: normal 700 0.82rem/1 var(--vp-font-family-mono);
}

.controller-catalog article strong,
.controller-catalog article small,
.controller-selected-action strong,
.controller-selected-action small,
.controller-history article strong,
.controller-history article small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.controller-catalog article strong,
.controller-selected-action strong,
.controller-history article strong {
  color: #e5e7ed;
  font-size: 0.62rem;
}

.controller-catalog article small,
.controller-selected-action small,
.controller-history article small {
  margin-top: 0.16rem;
  color: #737c8c;
  font: 0.53rem/1.2 var(--vp-font-family-mono);
}

.controller-catalog article > em {
  position: absolute;
  right: 0.45rem;
  bottom: 0.35rem;
  color: #67def8;
  font: normal 700 0.43rem/1 var(--vp-font-family-mono);
}

.controller-catalog article.is-selected {
  border-color: #23c7e7;
  background: rgba(20, 116, 139, 0.18);
  box-shadow: 0 0 22px rgba(35, 199, 231, 0.16);
}

.controller-catalog article.is-selected > i {
  background: #139fc1;
  color: #e6fbff;
}

.controller-loop {
  position: relative;
  min-width: 560px;
  height: 285px;
  margin-top: 0.85rem;
  overflow: hidden;
  border: 1px solid #2d3442;
  border-radius: 14px;
  background: radial-gradient(circle at 50% 50%, rgba(22, 153, 184, 0.12), transparent 28%), rgba(10, 14, 22, 0.82);
}

.controller-loop-track {
  position: absolute;
  inset: 38px 74px;
  border: 2px solid #245b70;
  border-radius: 82px;
  box-shadow: inset 0 0 18px rgba(35, 199, 231, 0.08), 0 0 18px rgba(35, 199, 231, 0.08);
}

.controller-loop-track::after {
  position: absolute;
  top: -4px;
  left: -4px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #b8f5ff;
  box-shadow: 0 0 14px #21d4f4;
  content: '';
  opacity: 0;
  offset-path: inset(0 round 82px);
  offset-distance: 0%;
}

.controller-loop.is-active .controller-loop-track::after {
  opacity: 1;
  animation: controller-orbit 2.2s linear infinite;
}

.controller-stage {
  position: absolute;
  z-index: 2;
  display: flex;
  width: 128px;
  min-height: 54px;
  align-items: center;
  gap: 0.45rem;
  padding: 0.48rem;
  border: 1px solid #354050;
  border-radius: 9px;
  background: #151b25;
}

.controller-stage > i {
  display: grid;
  width: 25px;
  height: 25px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 6px;
  background: rgba(109, 92, 232, 0.18);
  color: #a99fff;
  font: normal 700 0.66rem/1 var(--vp-font-family-mono);
}

.controller-stage b,
.controller-stage small {
  display: block;
}

.controller-stage b {
  color: #5eddf4;
  font: 700 0.54rem/1 var(--vp-font-family-mono);
  letter-spacing: 0.04em;
}

.controller-stage small {
  margin-top: 0.18rem;
  color: #8a93a2;
  font-size: 0.5rem;
}

.stage-choose { top: 15px; left: 20px; }
.stage-run { top: 15px; right: 20px; }
.stage-observe { right: 20px; bottom: 15px; }
.stage-update { bottom: 15px; left: 20px; }

.controller-core {
  position: absolute;
  z-index: 3;
  top: 50%;
  left: 50%;
  display: grid;
  width: 96px;
  height: 96px;
  place-content: center;
  border: 2px solid #23c7e7;
  border-radius: 50%;
  background: #0c1b26;
  box-shadow: 0 0 0 7px rgba(35, 199, 231, 0.08), 0 0 30px rgba(35, 199, 231, 0.2);
  text-align: center;
  transform: translate(-50%, -50%);
}

.controller-core span {
  color: #62def5;
  font: 700 0.48rem/1 var(--vp-font-family-mono);
  letter-spacing: 0.06em;
}

.controller-core strong {
  margin-top: 0.32rem;
  color: #e7fbff;
  font: 700 0.9rem/1 var(--vp-font-family-mono);
}

.controller-loop.is-complete .controller-core {
  border-color: #33ce74;
  box-shadow: 0 0 0 7px rgba(51, 206, 116, 0.08), 0 0 30px rgba(51, 206, 116, 0.18);
}

.controller-loop.is-complete .controller-core span,
.controller-loop.is-complete .controller-core strong {
  color: #76e4a3;
}

.controller-selected-action {
  position: absolute;
  z-index: 4;
  top: 50%;
  right: 8%;
  display: grid;
  width: 142px;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 0.45rem;
  padding: 0.55rem;
  border: 1px solid #23c7e7;
  border-radius: 9px;
  background: #0e2834;
  box-shadow: 0 0 24px rgba(35, 199, 231, 0.2);
  transform: translateY(-50%);
}

.controller-selected-action > i {
  background: #139fc1;
  color: #e6fbff;
}

.controller-observation {
  position: absolute;
  z-index: 4;
  top: 50%;
  left: 7%;
  display: grid;
  width: 158px;
  gap: 0.22rem;
  margin: 0;
  padding: 0.6rem;
  border: 1px solid #3b8e60;
  border-radius: 9px;
  background: #10231a;
  transform: translateY(-50%);
}

.controller-observation.is-failed {
  border-color: #b64f4b;
  background: #281516;
}

.controller-observation > span {
  color: #6cd997;
  font: 700 0.46rem/1 var(--vp-font-family-mono);
  letter-spacing: 0.05em;
}

.controller-observation.is-failed > span {
  color: #f07773;
}

.controller-observation > strong {
  color: #dce3e7;
  font: 600 0.56rem/1.35 var(--vp-font-family-mono);
}

.controller-history {
  min-width: 560px;
  margin-top: 0.75rem;
}

.controller-history > header {
  margin-bottom: 0.4rem;
  color: #727b8b;
  font: 700 0.53rem/1 var(--vp-font-family-mono);
  letter-spacing: 0.06em;
}

.controller-history > div {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.45rem;
}

.controller-history article {
  display: grid;
  min-width: 0;
  min-height: 55px;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 0.45rem;
  padding: 0.5rem;
  border: 1px solid #313846;
  border-radius: 8px;
  background: #121720;
}

.controller-history article.is-succeeded {
  border-color: rgba(51, 206, 116, 0.5);
}

.controller-history article.is-failed {
  border-color: rgba(237, 96, 92, 0.54);
}

.controller-history article.is-succeeded small { color: #65dc94; }
.controller-history article.is-failed small { color: #f07773; }

.controller-history > p {
  margin: 0;
  padding: 0.8rem;
  border: 1px dashed #303746;
  border-radius: 8px;
  color: #687181;
  font: 0.58rem/1.3 var(--vp-font-family-mono);
  text-align: center;
}

.controller-card-enter-active,
.controller-result-enter-active {
  transition: opacity 260ms ease, transform 360ms ease;
}

.controller-card-enter-from {
  opacity: 0;
  transform: translate(55px, -50%);
}

.controller-result-enter-from {
  opacity: 0;
  transform: translate(-45px, -50%);
}

.controller-card-leave-active,
.controller-result-leave-active {
  transition: opacity 100ms ease;
}

.controller-card-leave-to,
.controller-result-leave-to {
  opacity: 0;
}

.run-footer {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 1rem;
  padding: 0.8rem 1rem;
  border-top: 1px solid #252a37;
  background: #11151e;
}

.run-footer p {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-width: 0;
  margin: 0;
  overflow: hidden;
  color: #8b93a2;
  font: 0.64rem/1.4 var(--vp-font-family-mono);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.run-footer p > span:last-child {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.run-footer p b {
  color: #7f8796;
  font-size: 0.54rem;
  letter-spacing: 0.08em;
}

.run-footer .event-icon {
  display: grid;
  place-items: center;
  flex: 0 0 30px;
  width: 30px;
  height: 30px;
  border-radius: 7px;
  background: #151a25;
  color: #8a7cf7;
  font-size: 1.15rem;
}

.run-footer button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  min-width: 156px;
  min-height: 38px;
  padding: 0.55rem 0.85rem;
  border: 1px solid #8477ed;
  border-radius: 8px;
  background: #6d5ce8;
  color: #fff;
  font: 700 0.72rem/1 var(--vp-font-family-base);
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(109, 92, 232, 0.2);
}

.run-footer button:hover:not(:disabled) {
  background: #7c6ef4;
}

.run-footer button:disabled {
  border-color: #343a48;
  background: #232936;
  color: #858d9b;
  cursor: default;
  box-shadow: none;
}

.button-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid #555d6c;
  border-top-color: #b7b0f9;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
}

button:focus-visible,
a:focus-visible {
  outline: 3px solid rgba(183, 176, 249, 0.65);
  outline-offset: 2px;
}

.hero-copy-enter-active,
.hero-copy-leave-active {
  transition: opacity 130ms ease, transform 130ms ease;
}

.hero-copy-enter-from,
.hero-copy-leave-to {
  opacity: 0;
  transform: translateY(5px);
}

.nested-run-enter-active,
.nested-run-leave-active {
  transition: opacity 220ms ease, transform 220ms ease;
}

.nested-run-enter-from,
.nested-run-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@keyframes status-pulse {
  50% { opacity: 0.38; transform: scale(0.78); }
}

@keyframes edge-travel {
  from { transform: translateX(-100%); }
  to { transform: translateX(250%); }
}

@keyframes agent-breathe {
  50% { box-shadow: 0 0 24px rgba(109, 92, 232, 0.3); }
}

@keyframes controller-orbit {
  to { offset-distance: 100%; }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 760px) {
  .workflow-demo {
    border-radius: 14px;
  }

  .run-toolbar {
    min-height: 56px;
  }

  .run-canvas {
    min-height: 275px;
  }

  .canvas-controller {
    min-height: 0;
    overflow: visible;
  }

  .controller-topline {
    min-width: 0;
    grid-template-columns: 1fr;
  }

  .controller-catalog > div {
    grid-template-columns: 1fr;
  }

  .controller-catalog article {
    min-height: 60px;
    grid-template-columns: auto minmax(0, 1fr);
  }

  .controller-catalog article > em {
    display: none;
  }

  .controller-loop {
    min-width: 0;
    height: 455px;
  }

  .controller-loop-track {
    inset: 40px 26px;
    border-radius: 105px;
  }

  .controller-stage {
    width: 108px;
  }

  .stage-choose { top: 16px; left: 12px; }
  .stage-run { top: 16px; right: 12px; }
  .stage-observe { right: 12px; bottom: 16px; }
  .stage-update { bottom: 16px; left: 12px; }

  .controller-core {
    top: 40%;
    width: 88px;
    height: 88px;
  }

  .controller-selected-action {
    top: 59%;
    right: auto;
    left: 50%;
    margin-left: -71px;
  }

  .controller-observation {
    top: 73%;
    left: 50%;
    margin-left: -79px;
  }

  .controller-history {
    min-width: 0;
  }

  .controller-history > div {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .workflow-tabs button {
    min-height: 56px;
    padding: 0.45rem 0.25rem;
    font-size: 0.58rem;
  }

  .run-label {
    display: none;
  }

  .run-toolbar strong {
    font-size: 0.66rem;
  }

  .run-toolbar-tools {
    gap: 0.45rem;
  }

  .yaml-open {
    padding: 0.4rem 0.5rem;
    font-size: 0.6rem;
  }

  .run-state span {
    display: none;
  }

  .yaml-dialog {
    width: calc(100vw - 20px);
    max-height: calc(100vh - 20px);
    border-radius: 10px;
  }

  .yaml-document-tabs {
    overflow-x: auto;
  }

  .yaml-document-tabs button {
    flex: 0 0 auto;
    padding-right: 0.7rem;
    padding-left: 0.7rem;
    font-size: 0.64rem;
  }

  .yaml-code {
    height: calc(100vh - 385px);
    min-height: 170px;
  }

  .yaml-ai-callout {
    grid-template-columns: 32px minmax(0, 1fr);
  }

  .yaml-ai-callout > a {
    grid-column: 2;
    justify-self: start;
  }

  .yaml-dialog-footer {
    align-items: stretch;
    flex-direction: column;
    gap: 0.55rem;
  }

  .yaml-dialog-footer button {
    width: 100%;
  }

  .run-footer {
    grid-template-columns: 1fr;
    gap: 0.55rem;
  }

  .run-footer button {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
