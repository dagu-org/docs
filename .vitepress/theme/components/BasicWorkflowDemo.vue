<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import workflowYaml from './basic-workflows/release-readiness.yaml?raw'

const nodes = [
  { id: 'schedule', icon: '◷', label: 'Weekdays · 09:00', meta: 'Schedule' },
  { id: 'collect', icon: '›_', label: 'Collect context', meta: 'Any command' },
  { id: 'agent', icon: '✦', label: 'OpenCode review', meta: 'harness.run' },
  { id: 'docker', icon: '⬡', label: 'Container check', meta: 'docker.run' },
  { id: 'summary', icon: '✦', label: 'Release brief', meta: 'chat.completion' },
  { id: 'human', icon: '⌁', label: 'Release handoff', meta: 'human.task' },
  { id: 'report', icon: '▤', label: 'Release report', meta: 'template.render' },
]

const phases = [
  { active: ['schedule'], done: [], event: 'Schedule fired · 09:00:00', duration: 650 },
  { active: ['collect'], done: ['schedule'], event: 'Reading commit and release context', duration: 800 },
  { active: ['agent', 'docker'], done: ['schedule', 'collect'], event: 'OpenCode: reading the diff · Docker: starting alpine:3.21', agentAction: 0, dockerProgress: 18, duration: 900 },
  { active: ['agent', 'docker'], done: ['schedule', 'collect'], event: 'OpenCode: assessing risk · Docker: 108 / 148 checks passed', agentAction: 1, dockerProgress: 73, duration: 1000 },
  { active: ['summary'], done: ['schedule', 'collect', 'agent', 'docker'], event: 'AI is synthesizing the release brief', streamLine: 2, duration: 1000 },
  { active: [], done: ['schedule', 'collect', 'agent', 'docker', 'summary'], waiting: ['human'], event: 'Waiting for typed release details' },
  { active: ['report'], done: ['schedule', 'collect', 'agent', 'docker', 'summary', 'human'], event: 'Rendering release-readiness.md', duration: 850 },
  { active: [], done: nodes.map((node) => node.id), event: 'Release report is ready', complete: true },
]

const phaseIndex = ref(-1)
const elapsed = ref(0)
const reduceMotion = ref(false)
const yamlDialog = ref()
const copyLabel = ref('Copy workflow')
let phaseTimer
let clockTimer
let copyTimer
let startedAt

const phase = computed(() => phases[phaseIndex.value])
const isWaiting = computed(() => Boolean(phase.value?.waiting?.length))
const isComplete = computed(() => Boolean(phase.value?.complete))
const isRunning = computed(() => phaseIndex.value >= 0 && !isWaiting.value && !isComplete.value)
const runStatus = computed(() => {
  if (phaseIndex.value < 0) return 'READY'
  if (isWaiting.value) return 'WAITING'
  if (isComplete.value) return 'SUCCEEDED'
  return 'RUNNING'
})
const actionLabel = computed(() => {
  if (phaseIndex.value < 0) return 'Run workflow'
  if (isWaiting.value) return 'Use the form above'
  if (isComplete.value) return 'Replay workflow'
  return 'Running…'
})
const yamlLines = computed(() => workflowYaml.trimEnd().split('\n'))
const showAgentPanel = computed(() => nodeStatus('agent') === 'running')
const showSummaryPanel = computed(() => nodeStatus('summary') === 'running')
const showHumanPanel = computed(() => isWaiting.value)
const showArtifactPanel = computed(() => nodeStatus('report') === 'running' || isComplete.value)

function capture(event, properties = {}) {
  window.posthog?.capture?.(event, {
    surface: 'docs',
    page: 'basic_examples',
    scenario: 'release_readiness',
    ...properties,
  })
}

function nodeStatus(id) {
  if (!phase.value) return 'queued'
  if (phase.value.waiting?.includes(id)) return 'waiting'
  if (phase.value.active.includes(id)) return 'running'
  if (phase.value.done.includes(id)) return 'succeeded'
  return 'queued'
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

function startClock() {
  startedAt = Date.now()
  clockTimer = setInterval(() => {
    elapsed.value = (Date.now() - startedAt) / 1000
  }, 100)
}

function showPhase(index) {
  phaseIndex.value = index
  const next = phases[index]
  if (next.complete) {
    elapsed.value = (Date.now() - startedAt) / 1000
    clearInterval(clockTimer)
    capture('basic_demo_completed', { elapsed_seconds: Number(elapsed.value.toFixed(1)) })
    return
  }
  if (!next.waiting?.length) {
    phaseTimer = setTimeout(() => showPhase(index + 1), reduceMotion.value ? 120 : next.duration)
  }
}

function runDemo() {
  if (phaseIndex.value < 0 || isComplete.value) {
    const replay = isComplete.value
    capture(replay ? 'basic_demo_replayed' : 'basic_demo_started')
    resetRun()
    startClock()
    showPhase(0)
  }
}

function completeHumanTask() {
  if (!isWaiting.value) return
  capture('basic_demo_human_task_submitted', { step: 'release_handoff' })
  showPhase(phaseIndex.value + 1)
}

function openYaml() {
  copyLabel.value = 'Copy workflow'
  yamlDialog.value.showModal()
  capture('basic_demo_yaml_opened')
}

async function copyYaml() {
  try {
    await navigator.clipboard.writeText(workflowYaml)
    copyLabel.value = 'Copied!'
    capture('basic_demo_yaml_copied')
  } catch {
    copyLabel.value = 'Copy failed'
  }
  clearTimeout(copyTimer)
  copyTimer = setTimeout(() => { copyLabel.value = 'Copy workflow' }, 1800)
}

onMounted(() => {
  reduceMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
})

onBeforeUnmount(stopTimers)
</script>

<template>
  <section class="basic-demo" aria-label="Animated release readiness workflow">
    <header class="demo-toolbar">
      <div>
        <span>LIVE WORKFLOW</span>
        <strong>release-readiness · #1042</strong>
      </div>
      <div class="toolbar-actions">
        <button type="button" class="yaml-button" @click="openYaml"><span aria-hidden="true">&lt;/&gt;</span> View complete YAML</button>
        <div class="run-status" :class="`is-${runStatus.toLowerCase()}`">
          <i aria-hidden="true"></i>{{ runStatus }}<span>{{ elapsed.toFixed(1) }}s</span>
        </div>
      </div>
    </header>

    <div class="demo-stage">
      <div class="graph-scroll">
        <div class="workflow-graph">
          <svg class="graph-edges" viewBox="0 0 980 340" aria-hidden="true">
            <path d="M135 170 H175" :class="`is-${nodeStatus('collect')}`" />
            <path d="M305 170 C330 170 325 90 350 90" :class="`is-${nodeStatus('agent')}`" />
            <path d="M305 170 C330 170 325 250 350 250" :class="`is-${nodeStatus('docker')}`" />
            <path d="M480 90 C515 90 505 170 540 170" :class="`is-${nodeStatus('summary')}`" />
            <path d="M480 250 C515 250 505 170 540 170" :class="`is-${nodeStatus('summary')}`" />
            <path d="M670 170 H700" :class="`is-${nodeStatus('human')}`" />
            <path d="M830 170 H850" :class="`is-${nodeStatus('report')}`" />
          </svg>

          <article
            v-for="node in nodes"
            :key="node.id"
            class="graph-node"
            :class="[`node-${node.id}`, `is-${nodeStatus(node.id)}`]"
          >
            <span class="node-icon" aria-hidden="true">{{ nodeStatus(node.id) === 'succeeded' ? '✓' : node.icon }}</span>
            <span><strong>{{ node.label }}</strong><small>{{ node.meta }}</small></span>
            <em>{{ nodeStatus(node.id) }}</em>
          </article>
        </div>
      </div>

      <Transition name="panel" mode="out-in">
        <aside v-if="showAgentPanel" key="agent" class="detail-panel agent-panel">
          <header><span>✦</span><div><b>OpenCode activity</b><small>Repository review · read-only</small></div></header>
          <ol>
            <li class="is-done"><i>✓</i>Read current diff</li>
            <li :class="{ 'is-done': phase.agentAction > 0, 'is-active': phase.agentAction === 0 }"><i>{{ phase.agentAction > 0 ? '✓' : '⌁' }}</i>Inspect changed tests</li>
            <li :class="{ 'is-active': phase.agentAction === 1 }"><i>⌁</i>Assess release risk</li>
          </ol>
          <div class="docker-progress"><span>Docker checks</span><b>{{ phase.dockerProgress }}%</b><i><em :style="{ width: `${phase.dockerProgress}%` }"></em></i></div>
        </aside>

        <aside v-else-if="showSummaryPanel" key="summary" class="detail-panel summary-panel">
          <header><span>✦</span><div><b>AI release brief</b><small>chat.completion · streaming</small></div></header>
          <p>Comparing the agent verdict with container results…</p>
          <p>Risk is low. All 148 checks passed.</p>
          <p class="is-streaming">Preparing the human handoff<span>▋</span></p>
        </aside>

        <form v-else-if="showHumanPanel" key="human" class="detail-panel human-panel" @submit.prevent="completeHumanTask">
          <header><span>⌁</span><div><b>Release handoff</b><small>human.task · waiting for input</small></div></header>
          <div class="human-fields">
            <label>Environment<select><option>Production</option><option>Staging</option></select></label>
            <label>Change ticket<input value="CHG-4821" pattern="CHG-[0-9]+"></label>
            <label>Release window<input value="Today · 22:00–23:00 UTC"></label>
            <label class="notify-field"><input type="checkbox" checked> Notify release engineering</label>
          </div>
          <button type="submit">Complete task</button>
        </form>

        <aside v-else-if="showArtifactPanel" key="artifact" class="detail-panel artifact-panel">
          <header><span>▤</span><div><b>release-readiness.md</b><small>{{ isComplete ? 'Artifact ready' : 'Rendering artifact…' }}</small></div></header>
          <div class="artifact-preview">
            <b># Release readiness · v1.4.0</b>
            <span>Commit: <code>9f3c7a1</code></span>
            <span>Environment: production</span>
            <span>✓ 148 checks passed · risk: low</span>
          </div>
          <div class="artifact-actions"><button type="button">Preview</button><button type="button">Download</button></div>
        </aside>

        <aside v-else key="intro" class="detail-panel intro-panel">
          <header><span>⌁</span><div><b>One file. A complete workflow.</b><small>Click Run to watch each capability compose.</small></div></header>
          <div class="capability-chips"><span>Schedule</span><span>Commands</span><span>Docker</span><span>AI agent</span><span>Human task</span><span>Artifact</span></div>
        </aside>
      </Transition>
    </div>

    <footer class="demo-footer">
      <p aria-live="polite"><span aria-hidden="true">⌁</span><b>EVENT</b>{{ phase?.event ?? 'Ready to run the release workflow' }}</p>
      <button type="button" :disabled="isRunning || isWaiting" @click="runDemo">
        <span v-if="isRunning" class="spinner" aria-hidden="true"></span>
        <span v-else aria-hidden="true">{{ isComplete ? '↻' : '▶' }}</span>
        {{ actionLabel }}
      </button>
    </footer>

    <dialog ref="yamlDialog" class="basic-yaml-dialog">
      <header>
        <div><strong>release-readiness.yaml</strong><span>Validated with the current Dagu CLI</span></div>
        <form method="dialog"><button type="submit" aria-label="Close YAML viewer">×</button></form>
      </header>
      <pre tabindex="0"><code><span v-for="(line, index) in yamlLines" :key="index">{{ line || ' ' }}</span></code></pre>
      <aside>
        <span aria-hidden="true">✦</span>
        <div><strong>Prefer describing the workflow?</strong><p>Connect an AI agent or chat app through MCP and ask it to create or edit Dagu YAML.</p></div>
        <a href="/mcp/quickstart">Set up MCP →</a>
      </aside>
      <footer><span>Requires Git, Docker or Podman, OpenCode, and an OpenRouter key.</span><button type="button" @click="copyYaml">{{ copyLabel }}</button></footer>
    </dialog>
  </section>
</template>

<style scoped>
.basic-demo {
  position: relative;
  width: 100%;
  container-type: inline-size;
  overflow: hidden;
  border: 1px solid #2b3040;
  border-radius: 18px;
  background: #0c1017;
  box-shadow: 0 24px 64px rgba(5, 7, 12, 0.22);
  color: #f4f5f7;
}

.demo-toolbar,
.demo-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.8rem 1rem;
  border-color: #272c39;
  background: #11151e;
}

.demo-toolbar { border-bottom: 1px solid #272c39; }
.demo-footer { border-top: 1px solid #272c39; }
.demo-toolbar > div:first-child { display: flex; flex-direction: column; gap: 0.22rem; min-width: 0; }
.demo-toolbar > div:first-child span { color: #8f97a8; font: 700 0.57rem/1 var(--vp-font-family-mono); letter-spacing: 0.08em; }
.demo-toolbar strong { overflow: hidden; color: #e5e7eb; font: 650 0.78rem/1.2 var(--vp-font-family-mono); text-overflow: ellipsis; white-space: nowrap; }
.toolbar-actions { display: flex; align-items: center; gap: 0.75rem; }

.yaml-button,
.demo-footer button,
.human-panel > button,
.artifact-actions button {
  border: 1px solid #3a4050;
  border-radius: 7px;
  background: #191e29;
  color: #d8dbe2;
  cursor: pointer;
  font: 650 0.68rem/1 var(--vp-font-family-base);
}

.yaml-button { display: flex; align-items: center; gap: 0.35rem; padding: 0.55rem 0.65rem; }
.yaml-button span { color: #a79efa; font-family: var(--vp-font-family-mono); }
.yaml-button:hover, .artifact-actions button:hover { border-color: #7569de; color: #fff; }
.run-status { display: flex; align-items: center; gap: 0.38rem; color: #929aaa; font: 700 0.61rem/1 var(--vp-font-family-mono); }
.run-status i { width: 7px; height: 7px; border-radius: 50%; background: #687080; }
.run-status > span { padding-left: 0.35rem; border-left: 1px solid #343947; color: #6f7787; }
.run-status.is-running { color: #67a6ff; }
.run-status.is-running i { background: #458de8; box-shadow: 0 0 10px rgba(69, 141, 232, 0.75); animation: pulse 1s infinite; }
.run-status.is-waiting { color: #f2b84b; }
.run-status.is-waiting i { background: #f2b84b; }
.run-status.is-succeeded { color: #62d38b; }
.run-status.is-succeeded i { background: #4cc979; }

.demo-stage { min-height: 520px; background: radial-gradient(circle at 50% 30%, rgba(69, 84, 128, 0.16), transparent 42%), radial-gradient(#242a37 0.75px, transparent 0.75px); background-size: auto, 16px 16px; }
.graph-scroll { overflow-x: auto; scrollbar-width: thin; scrollbar-color: #333a4a transparent; }
.workflow-graph { position: relative; width: 980px; height: 340px; margin: 0 auto; }
.graph-edges { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
.graph-edges path { fill: none; stroke: #333a49; stroke-width: 2; }
.graph-edges path.is-running,
.graph-edges path.is-waiting { stroke: #438fe9; stroke-dasharray: 7 7; animation: dash 0.75s linear infinite; filter: drop-shadow(0 0 4px rgba(67, 143, 233, 0.75)); }
.graph-edges path.is-succeeded { stroke: #44bc70; }

.graph-node { position: absolute; z-index: 1; display: grid; grid-template-columns: auto 1fr; align-items: center; gap: 0.6rem; width: 130px; min-height: 72px; padding: 0.65rem; border: 1px solid #3a4050; border-radius: 10px; background: linear-gradient(145deg, #171c26, #11151d); box-shadow: 0 9px 20px rgba(0, 0, 0, 0.18); transition: border-color 0.25s, box-shadow 0.25s; }
.graph-node .node-icon { display: grid; place-items: center; width: 28px; height: 28px; border: 1px solid #4c5568; border-radius: 50%; color: #8d96a8; font: 700 0.67rem/1 var(--vp-font-family-mono); }
.graph-node > span:nth-child(2) { min-width: 0; }
.graph-node strong, .graph-node small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.graph-node strong { color: #e2e4e9; font: 650 0.68rem/1.25 var(--vp-font-family-base); }
.graph-node small { margin-top: 0.24rem; color: #7e8798; font: 0.57rem/1.2 var(--vp-font-family-mono); }
.graph-node em { grid-column: 1 / -1; color: #687183; font: 700 0.49rem/1 var(--vp-font-family-mono); letter-spacing: 0.06em; text-transform: uppercase; }
.graph-node.is-running { border-color: #428fe9; box-shadow: 0 0 0 1px rgba(66, 143, 233, 0.25), 0 0 24px rgba(66, 143, 233, 0.18); }
.graph-node.is-running .node-icon { border-color: #428fe9; color: #67a6ff; animation: pulse 1s infinite; }
.graph-node.is-running em { color: #67a6ff; }
.graph-node.is-waiting { border-color: #d89b2b; box-shadow: 0 0 22px rgba(216, 155, 43, 0.17); }
.graph-node.is-waiting .node-icon, .graph-node.is-waiting em { border-color: #d89b2b; color: #f0b645; }
.graph-node.is-succeeded { border-color: #39995d; background: linear-gradient(145deg, rgba(39, 98, 62, 0.28), #11191a); }
.graph-node.is-succeeded .node-icon { border-color: #43b96d; background: #296b43; color: #d8ffe6; }
.graph-node.is-succeeded em { color: #5ecf87; }
.node-schedule { left: 5px; top: 134px; }
.node-collect { left: 175px; top: 134px; }
.node-agent { left: 350px; top: 54px; }
.node-docker { left: 350px; top: 214px; }
.node-summary { left: 540px; top: 134px; }
.node-human { left: 700px; top: 134px; }
.node-report { left: 850px; top: 134px; width: 120px; }

.detail-panel { width: min(620px, calc(100% - 2rem)); min-height: 144px; margin: 0 auto 1rem; padding: 0.9rem; border: 1px solid #303746; border-radius: 12px; background: rgba(17, 21, 30, 0.97); box-shadow: 0 16px 34px rgba(0, 0, 0, 0.22); }
.detail-panel header { display: flex; align-items: center; gap: 0.65rem; margin-bottom: 0.8rem; }
.detail-panel header > span { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 8px; background: rgba(114, 96, 225, 0.2); color: #a89cfb; }
.detail-panel header b, .detail-panel header small { display: block; }
.detail-panel header b { color: #eaebef; font: 650 0.78rem/1.2 var(--vp-font-family-base); }
.detail-panel header small { margin-top: 0.18rem; color: #7f8899; font: 0.59rem/1.2 var(--vp-font-family-mono); }
.agent-panel ol { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; margin: 0; padding: 0; list-style: none; }
.agent-panel li { display: flex; align-items: center; gap: 0.4rem; padding: 0.5rem; border: 1px solid #2d3442; border-radius: 7px; color: #747d8d; font-size: 0.64rem; }
.agent-panel li i { display: grid; place-items: center; width: 18px; height: 18px; border-radius: 50%; background: #242a37; font-style: normal; }
.agent-panel li.is-done { color: #73d493; }
.agent-panel li.is-active { border-color: #397fce; color: #78b0fa; }
.docker-progress { display: grid; grid-template-columns: 1fr auto; gap: 0.3rem; margin-top: 0.7rem; color: #8e97a7; font: 0.58rem/1 var(--vp-font-family-mono); }
.docker-progress > i { grid-column: 1 / -1; overflow: hidden; height: 4px; border-radius: 4px; background: #292f3d; }
.docker-progress > i em { display: block; height: 100%; background: #478fe6; transition: width 0.3s; }
.summary-panel p { margin: 0.28rem 0; color: #aab0bc; font: 0.67rem/1.5 var(--vp-font-family-mono); }
.summary-panel .is-streaming { color: #75adf5; }
.summary-panel .is-streaming span { animation: blink 0.8s steps(1) infinite; }

.human-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 0.55rem; }
.human-fields label { color: #a8aebb; font: 0.59rem/1.2 var(--vp-font-family-base); }
.human-fields input:not([type='checkbox']), .human-fields select { width: 100%; height: 34px; margin-top: 0.3rem; padding: 0 0.55rem; border: 1px solid #384052; border-radius: 6px; outline: none; background: #0e1219; color: #e2e4e9; font: 0.65rem/1 var(--vp-font-family-base); }
.human-fields input:focus, .human-fields select:focus { border-color: #7569de; }
.human-fields .notify-field { display: flex; align-items: center; gap: 0.4rem; grid-column: 1 / -1; }
.human-panel > button { width: 100%; margin-top: 0.7rem; padding: 0.65rem; border-color: #7569de; background: linear-gradient(90deg, #6552dc, #7d54e4); color: white; }
.artifact-preview { display: grid; gap: 0.3rem; padding: 0.65rem; border: 1px solid #2d3441; border-radius: 7px; background: #0c1016; color: #a8b0bd; font: 0.61rem/1.35 var(--vp-font-family-mono); }
.artifact-preview b { color: #eef0f3; }
.artifact-preview span:last-child { color: #67ce8b; }
.artifact-actions { display: flex; gap: 0.5rem; margin-top: 0.65rem; }
.artifact-actions button { flex: 1; padding: 0.55rem; }
.capability-chips { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.capability-chips span { padding: 0.32rem 0.5rem; border: 1px solid #353c4b; border-radius: 99px; color: #9da5b4; font: 0.58rem/1 var(--vp-font-family-mono); }

.demo-footer p { display: flex; align-items: center; gap: 0.5rem; min-width: 0; margin: 0; color: #b1b6c0; font: 0.64rem/1.3 var(--vp-font-family-mono); }
.demo-footer p > span { color: #897bf0; font-size: 1rem; }
.demo-footer p b { color: #697286; font-size: 0.52rem; letter-spacing: 0.08em; }
.demo-footer > button { display: flex; align-items: center; justify-content: center; gap: 0.45rem; min-width: 138px; padding: 0.62rem 0.8rem; border-color: #7569de; background: #6759d3; color: white; }
.demo-footer > button:disabled { cursor: default; opacity: 0.75; }
.spinner { width: 12px; height: 12px; border: 2px solid rgba(255, 255, 255, 0.35); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; }

.basic-yaml-dialog { grid-template-rows: auto minmax(0, 1fr) auto auto; width: min(920px, calc(100vw - 2rem)); height: min(780px, calc(100vh - 2rem)); padding: 0; overflow: hidden; border: 1px solid #373d4c; border-radius: 14px; background: #10141c; color: #e7e9ed; box-shadow: 0 30px 90px rgba(0, 0, 0, 0.55); }
.basic-yaml-dialog[open] { display: grid; }
.basic-yaml-dialog::backdrop { background: rgba(5, 7, 11, 0.78); backdrop-filter: blur(3px); }
.basic-yaml-dialog > header, .basic-yaml-dialog > footer { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 0.8rem 1rem; background: #171b24; }
.basic-yaml-dialog > header { border-bottom: 1px solid #303644; }
.basic-yaml-dialog > header div { display: flex; flex-direction: column; gap: 0.2rem; }
.basic-yaml-dialog > header strong { font: 650 0.78rem/1.2 var(--vp-font-family-mono); }
.basic-yaml-dialog > header span, .basic-yaml-dialog > footer span { color: #858e9e; font-size: 0.62rem; }
.basic-yaml-dialog > header button { border: 0; background: transparent; color: #a8afbb; font-size: 1.35rem; cursor: pointer; }
.basic-yaml-dialog pre { min-height: 0; margin: 0; padding: 1rem; overflow: auto; background: #0b0f15; color: #c8d0dd; font: 0.65rem/1.55 var(--vp-font-family-mono); }
.basic-yaml-dialog pre code > span { display: block; min-height: 1em; }
.basic-yaml-dialog > aside { display: flex; align-items: center; gap: 0.7rem; padding: 0.75rem 1rem; border-top: 1px solid #2e3441; background: rgba(109, 92, 232, 0.09); }
.basic-yaml-dialog > aside > span { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 8px; background: rgba(109, 92, 232, 0.2); color: #aa9ff8; }
.basic-yaml-dialog > aside div { flex: 1; }
.basic-yaml-dialog > aside strong { font-size: 0.7rem; }
.basic-yaml-dialog > aside p { margin: 0.12rem 0 0; color: #929aaa; font-size: 0.62rem; }
.basic-yaml-dialog > aside a { color: #a89df7; font-size: 0.65rem; font-weight: 650; text-decoration: none; white-space: nowrap; }
.basic-yaml-dialog > footer { border-top: 1px solid #303644; }
.basic-yaml-dialog > footer button { padding: 0.55rem 0.75rem; border: 1px solid #7569de; border-radius: 7px; background: #6759d3; color: white; cursor: pointer; font-weight: 650; }

.panel-enter-active, .panel-leave-active { transition: opacity 0.2s, transform 0.2s; }
.panel-enter-from, .panel-leave-to { opacity: 0; transform: translateY(8px); }
@keyframes dash { to { stroke-dashoffset: -14; } }
@keyframes pulse { 50% { opacity: 0.48; } }
@keyframes blink { 50% { opacity: 0; } }
@keyframes spin { to { transform: rotate(360deg); } }

@media (min-width: 1080px) {
  .basic-demo { position: relative; left: 50%; width: min(980px, calc(100vw - 340px)); transform: translateX(-50%); }
}

@container (max-width: 760px) {
  .demo-toolbar, .demo-footer { align-items: flex-start; flex-direction: column; }
  .toolbar-actions { width: 100%; justify-content: space-between; }
  .yaml-button { padding-inline: 0.5rem; }
  .demo-stage { min-height: 680px; }
  .workflow-graph { width: 100%; height: 460px; display: grid; grid-template-columns: 1fr 1fr; gap: 0.55rem; padding: 1rem; }
  .graph-edges { display: none; }
  .graph-node { position: relative; inset: auto; width: auto; min-height: 76px; }
  .graph-node::after { content: '↓'; position: absolute; left: 50%; bottom: -0.9rem; z-index: 3; color: #465064; }
  .node-agent, .node-docker { margin-top: 0; }
  .node-schedule, .node-collect, .node-summary, .node-human, .node-report { grid-column: 1 / -1; }
  .node-schedule, .node-collect, .node-summary, .node-human, .node-report { width: 70%; justify-self: center; }
  .node-report::after { display: none; }
  .detail-panel { width: calc(100% - 1.5rem); }
  .agent-panel ol { grid-template-columns: 1fr; }
  .human-fields { grid-template-columns: 1fr; }
  .basic-yaml-dialog > aside { align-items: flex-start; flex-wrap: wrap; }
  .basic-yaml-dialog > aside a { margin-left: 38px; }
  .basic-yaml-dialog > footer { align-items: flex-start; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; scroll-behavior: auto !important; transition-duration: 0.01ms !important; }
}
</style>
