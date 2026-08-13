<script setup>
defineProps({
  kind: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <div class="recipe-visual" :class="`is-${kind}`">
    <div class="visual-bar">
      <span><i></i>LIVE PREVIEW</span>
      <em>{{ kind.replace('_', ' ') }}</em>
    </div>

    <div v-if="kind === 'graph'" class="visual-body graph-scene" aria-label="Checkout fans out to test and build, then both join at package">
      <div class="visual-node is-success"><i>✓</i><span><b>checkout</b><small>SUCCEEDED</small></span></div>
      <div class="fork-lines" aria-hidden="true"><i></i><i></i></div>
      <div class="parallel-stack">
        <div class="visual-node is-running"><i></i><span><b>test</b><small>RUNNING · 8s</small></span></div>
        <div class="visual-node is-running"><i></i><span><b>build</b><small>RUNNING · 8s</small></span></div>
      </div>
      <div class="join-lines" aria-hidden="true"><i></i><i></i></div>
      <div class="visual-node is-queued"><i>◷</i><span><b>package</b><small>WAITING FOR 2</small></span></div>
    </div>

    <div v-else-if="kind === 'data'" class="visual-body data-scene" aria-label="Parameters, constants, and environment values feed a release step whose outputs feed deploy">
      <div class="data-inputs">
        <span><i>{ }</i><b>params.ENVIRONMENT</b><em>staging</em></span>
        <span><i>C</i><b>consts.service</b><em>payments</em></span>
        <span><i>$</i><b>env.DEPLOY_TARGET</b><em>payments-staging</em></span>
      </div>
      <span class="visual-arrow" aria-hidden="true">→</span>
      <div class="output-card">
        <header><b>release</b><small>OUTPUT</small></header>
        <span><em>version</em><code>v2.5.0</code></span>
        <span><em>target</em><code>payments-staging</code></span>
      </div>
      <span class="visual-arrow" aria-hidden="true">→</span>
      <div class="visual-node is-queued"><i>›</i><span><b>deploy</b><small>2 VALUES READY</small></span></div>
    </div>

    <div v-else-if="kind === 'schedule'" class="visual-body schedule-scene" aria-label="Weekday schedule with catch-up window, retries, and timeout">
      <header class="schedule-header">
        <span><i>WED</i><b>09:00</b><small>America / New York</small></span>
        <span class="catchup"><b>4h</b><small>CATCH-UP WINDOW</small></span>
        <span class="timeout"><b>15m</b><small>TIMEOUT</small></span>
      </header>
      <div class="attempt-track">
        <div class="attempt is-failed"><i>1</i><span><b>Failed</b><small>connection reset</small></span></div>
        <span class="track-line"><em>retry in 30s</em></span>
        <div class="attempt is-running"><i>2</i><span><b>Retrying</b><small>attempt active</small></span></div>
        <span class="track-line"></span>
        <div class="attempt is-success"><i>3</i><span><b>Succeeded</b><small>within timeout</small></span></div>
      </div>
    </div>

    <div v-else-if="kind === 'container'" class="visual-body container-scene" aria-label="Dagu mounts the workspace into a Python container and captures pytest output as an artifact">
      <div class="boundary host-boundary">
        <small>DAGU HOST</small>
        <b>Workspace</b>
        <span>./ <em>read only</em></span>
      </div>
      <div class="mount-flow"><b>mount</b><span aria-hidden="true">→</span></div>
      <div class="boundary container-boundary">
        <small>CONTAINER</small>
        <b>python:3.13-slim</b>
        <span class="process"><i></i>pytest -q <em>RUNNING</em></span>
      </div>
      <div class="mount-flow"><b>stdout</b><span aria-hidden="true">→</span></div>
      <div class="artifact-card"><i>▤</i><span><b>test-results.txt</b><small>RUN ARTIFACT</small></span></div>
    </div>

    <div v-else-if="kind === 'llm'" class="visual-body llm-scene" aria-label="A masked key and prompt feed chat completion, whose streamed response becomes a Markdown artifact">
      <div class="llm-inputs">
        <span><i>⌑</i><b>OPENROUTER_API_KEY</b><em>••••••••••</em></span>
        <span><i>“</i><b>Prompt</b><em>Summarize incident…</em></span>
      </div>
      <span class="visual-arrow" aria-hidden="true">→</span>
      <div class="llm-node">
        <small>deepseek-v4-flash</small>
        <b>chat.completion</b>
        <span><i></i>STREAMING</span>
      </div>
      <div class="stream-card"><small>RESPONSE</small><span>Impact was detected…</span><span>Root cause was…</span><span class="is-live">Resolution involved…▋</span></div>
      <span class="visual-arrow" aria-hidden="true">→</span>
      <div class="artifact-card"><i>▤</i><span><b>incident-summary.md</b><small>ARTIFACT READY</small></span></div>
    </div>

    <div v-else-if="kind === 'agent'" class="visual-body agent-scene" aria-label="OpenCode reads a repository, performs visible actions, and writes a review artifact">
      <div class="repo-card"><i>⑂</i><span><b>Repository</b><small>latest commit</small></span></div>
      <span class="visual-arrow" aria-hidden="true">→</span>
      <div class="agent-card">
        <header><span><i>✦</i><b>OpenCode</b></span><em>PINNED · v1.18.11</em></header>
        <ul>
          <li class="is-done"><i>✓</i><span><b>Read diff</b><small>42 files</small></span></li>
          <li class="is-done"><i>✓</i><span><b>Inspect tests</b><small>148 checks</small></span></li>
          <li class="is-active"><i></i><span><b>Assess risks</b><small>agent working</small></span></li>
        </ul>
      </div>
      <span class="visual-arrow" aria-hidden="true">→</span>
      <div class="artifact-card"><i>▤</i><span><b>repository-review.md</b><small>RUN ARTIFACT</small></span></div>
    </div>

    <div v-else-if="kind === 'human'" class="visual-body human-scene" aria-label="A generated human task form passes typed values into a template and produces an artifact">
      <div class="human-task-card">
        <header><span><i>⌁</i><b>Release handoff</b></span><em>WAITING</em></header>
        <label>Environment<span>production⌄</span></label>
        <label>Change ticket<span>CHG-4821</span></label>
        <button type="button" tabindex="-1">Complete task</button>
      </div>
      <span class="completed-flow"><b>typed values</b><i aria-hidden="true">→</i></span>
      <div class="template-card"><i>&lt;/&gt;</i><span><b>template.render</b><small>RUNNING</small></span></div>
      <span class="visual-arrow" aria-hidden="true">→</span>
      <div class="preview-card"><header><i>▤</i><b>release-handoff.md</b></header><span># Release v1.4.0</span><span>Environment: production</span><span>Change: CHG-4821</span></div>
    </div>

    <div v-else-if="kind === 'nested'" class="visual-body nested-scene" aria-label="A parent DAG waits for a nested test suite DAG with parallel unit and race steps">
      <div class="parent-label"><span>PARENT DAG RUN</span><em>RUNNING</em></div>
      <div class="visual-node is-success"><i>✓</i><span><b>prepare</b><small>SUCCEEDED</small></span></div>
      <span class="visual-arrow" aria-hidden="true">→</span>
      <div class="child-boundary">
        <header><span><b>tests</b><small>CHILD DAG RUN · #1043</small></span><em>RUNNING</em></header>
        <div>
          <div class="visual-node is-running"><i></i><span><b>unit</b><small>go test</small></span></div>
          <div class="visual-node is-success"><i>✓</i><span><b>race</b><small>go test -race</small></span></div>
        </div>
        <footer><i>⌁</i>2 steps · separate logs and status</footer>
      </div>
      <span class="visual-arrow" aria-hidden="true">→</span>
      <div class="visual-node is-queued"><i>◷</i><span><b>publish</b><small>WAITS FOR CHILD</small></span></div>
    </div>
  </div>
</template>

<style scoped>
.recipe-visual {
  container-type: inline-size;
  overflow: hidden;
  margin: 0 0 1rem;
  border: 1px solid #2d3341;
  border-radius: 12px;
  background: #0c1017;
  box-shadow: inset 0 1px rgba(255, 255, 255, 0.025);
  color: #eef0f4;
}

.visual-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 34px;
  padding: 0 0.75rem;
  border-bottom: 1px solid #262c38;
  background: #121720;
  font: 700 0.5rem/1 var(--vp-font-family-mono);
  letter-spacing: 0.07em;
}

.visual-bar span { display: flex; align-items: center; gap: 0.4rem; color: #8992a3; }
.visual-bar span i { width: 6px; height: 6px; border-radius: 50%; background: #5bc982; box-shadow: 0 0 8px rgba(91, 201, 130, 0.65); }
.visual-bar em { color: #7367d7; font-style: normal; text-transform: uppercase; }
.visual-body { min-height: 190px; padding: 1rem; background: radial-gradient(circle at 50% 40%, rgba(84, 75, 145, 0.11), transparent 48%), radial-gradient(#212733 0.65px, transparent 0.65px); background-size: auto, 15px 15px; }
.visual-arrow { color: #7164df; font: 700 1.2rem/1 var(--vp-font-family-mono); }

.visual-node { display: flex; align-items: center; gap: 0.55rem; min-width: 118px; padding: 0.65rem; border: 1px solid #3a4252; border-radius: 9px; background: linear-gradient(145deg, #181d27, #11151d); }
.visual-node > i { display: grid; place-items: center; flex: 0 0 auto; width: 26px; height: 26px; border: 1px solid #566074; border-radius: 50%; color: #9ba4b5; font: 700 0.65rem/1 var(--vp-font-family-mono); font-style: normal; }
.visual-node span, .artifact-card span, .repo-card span, .template-card span { min-width: 0; }
.visual-node b, .visual-node small, .artifact-card b, .artifact-card small, .repo-card b, .repo-card small, .template-card b, .template-card small { display: block; }
.visual-node b, .artifact-card b, .repo-card b, .template-card b { overflow: hidden; color: #e6e8ed; font: 650 0.68rem/1.2 var(--vp-font-family-base); text-overflow: ellipsis; white-space: nowrap; }
.visual-node small, .artifact-card small, .repo-card small, .template-card small { margin-top: 0.22rem; color: #7d8798; font: 700 0.49rem/1 var(--vp-font-family-mono); letter-spacing: 0.04em; }
.visual-node.is-success { border-color: #347f50; }
.visual-node.is-success > i { border-color: #45ae68; background: #2b7547; color: white; }
.visual-node.is-success small { color: #58c87e; }
.visual-node.is-running { border-color: #347ed2; box-shadow: 0 0 16px rgba(52, 126, 210, 0.13); }
.visual-node.is-running > i, .agent-card li.is-active > i { border: 2px dashed #4f9cf2; animation: rv-spin 1.6s linear infinite; }
.visual-node.is-running small { color: #68a8f3; }
.visual-node.is-queued { border-color: #6f5624; }
.visual-node.is-queued > i { color: #e1a939; }
.visual-node.is-queued small { color: #c99735; }

.graph-scene { display: grid; grid-template-columns: minmax(118px, 1fr) 55px minmax(125px, 1fr) 55px minmax(118px, 1fr); align-items: center; }
.parallel-stack { display: grid; gap: 0.65rem; }
.fork-lines, .join-lines { position: relative; align-self: stretch; }
.fork-lines::before, .join-lines::before { content: ''; position: absolute; top: 50%; width: 50%; height: 1px; background: #438ade; }
.fork-lines::after, .join-lines::after { content: ''; position: absolute; top: 27%; bottom: 27%; width: 1px; background: #438ade; }
.fork-lines::before { left: 0; }
.fork-lines::after { right: 0; }
.join-lines::before { right: 0; }
.join-lines::after { left: 0; }
.fork-lines i, .join-lines i { position: absolute; width: 50%; height: 1px; background: #438ade; }
.fork-lines i { right: 0; }
.join-lines i { left: 0; }
.fork-lines i:first-child, .join-lines i:first-child { top: 27%; }
.fork-lines i:last-child, .join-lines i:last-child { bottom: 27%; }

.data-scene, .llm-scene, .agent-scene, .human-scene, .nested-scene, .container-scene { display: flex; align-items: center; gap: 0.75rem; }
.data-inputs, .llm-inputs { display: grid; flex: 1 1 0; gap: 0.42rem; }
.data-inputs > span, .llm-inputs > span { display: grid; grid-template-columns: auto 1fr; gap: 0.22rem 0.45rem; align-items: center; padding: 0.48rem; border: 1px solid #343b4a; border-radius: 7px; background: #141922; }
.data-inputs i, .llm-inputs i { grid-row: 1 / 3; display: grid; place-items: center; width: 23px; height: 23px; border-radius: 6px; background: #5d48c6; color: white; font: 700 0.55rem/1 var(--vp-font-family-mono); font-style: normal; }
.data-inputs b, .llm-inputs b { overflow: hidden; color: #d9dce3; font: 650 0.58rem/1.1 var(--vp-font-family-mono); text-overflow: ellipsis; white-space: nowrap; }
.data-inputs em, .llm-inputs em { color: #818a99; font: 0.5rem/1 var(--vp-font-family-mono); font-style: normal; }
.output-card { flex: 1.2 1 0; padding: 0.65rem; border: 1px solid #3d83d7; border-radius: 9px; background: #111823; }
.output-card header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem; }
.output-card header b { font-size: 0.7rem; }
.output-card header small { color: #68a8f3; font: 700 0.48rem/1 var(--vp-font-family-mono); }
.output-card > span { display: flex; justify-content: space-between; gap: 0.4rem; padding: 0.3rem 0.4rem; background: #0d121a; font: 0.52rem/1 var(--vp-font-family-mono); }
.output-card > span + span { margin-top: 0.25rem; }
.output-card em { color: #a997f8; font-style: normal; }
.output-card code { overflow: hidden; color: #72adf5; text-overflow: ellipsis; white-space: nowrap; }

.schedule-scene { display: grid; align-content: center; gap: 1.15rem; }
.schedule-header { display: grid; grid-template-columns: 1.4fr 1fr 1fr; gap: 0.6rem; }
.schedule-header > span { display: grid; grid-template-columns: auto 1fr; align-items: center; gap: 0.15rem 0.45rem; padding: 0.55rem 0.65rem; border: 1px solid #343b49; border-radius: 8px; background: #141922; }
.schedule-header > span i { grid-row: 1 / 3; padding: 0.36rem; border-radius: 5px; background: #654bd2; color: white; font: 700 0.48rem/1 var(--vp-font-family-mono); font-style: normal; }
.schedule-header b { font: 700 0.68rem/1 var(--vp-font-family-mono); }
.schedule-header small { color: #858e9e; font: 0.48rem/1 var(--vp-font-family-mono); }
.schedule-header .catchup { border-color: #5a469c; }
.schedule-header .timeout { border-color: #8c6926; }
.attempt-track { display: grid; grid-template-columns: 1fr 0.65fr 1fr 0.65fr 1fr; align-items: center; }
.attempt { display: flex; align-items: center; gap: 0.5rem; padding: 0.55rem; border: 1px solid #3a4250; border-radius: 8px; background: #131821; }
.attempt > i { display: grid; place-items: center; width: 24px; height: 24px; border-radius: 50%; color: white; font: 700 0.62rem/1 var(--vp-font-family-mono); font-style: normal; }
.attempt b, .attempt small { display: block; }
.attempt b { font-size: 0.62rem; }
.attempt small { margin-top: 0.2rem; color: #778193; font: 0.48rem/1 var(--vp-font-family-mono); }
.attempt.is-failed { border-color: #793c45; }
.attempt.is-failed > i { background: #a84350; }
.attempt.is-running { border-color: #347ed2; }
.attempt.is-running > i { background: #367dd0; animation: rv-pulse 1s infinite; }
.attempt.is-success { border-color: #347f50; }
.attempt.is-success > i { background: #318a51; }
.track-line { position: relative; height: 1px; background: #485164; }
.track-line::after { content: '›'; position: absolute; right: -1px; top: -8px; color: #7e899b; }
.track-line em { position: absolute; left: 50%; bottom: 6px; color: #6ca8ee; font: 0.46rem/1 var(--vp-font-family-mono); font-style: normal; white-space: nowrap; transform: translateX(-50%); }

.boundary { flex: 1 1 0; min-height: 125px; padding: 0.7rem; border: 1px solid #654dc5; border-radius: 9px; background: rgba(18, 23, 32, 0.93); }
.boundary > small { display: block; color: #8e80ed; font: 700 0.47rem/1 var(--vp-font-family-mono); letter-spacing: 0.06em; }
.boundary > b { display: block; margin-top: 0.6rem; font-size: 0.74rem; }
.boundary > span { display: flex; align-items: center; justify-content: space-between; margin-top: 0.7rem; padding: 0.5rem; border: 1px solid #343b49; border-radius: 6px; background: #0e131b; color: #bdc3ce; font: 0.55rem/1 var(--vp-font-family-mono); }
.boundary > span em { color: #9b8df4; font-size: 0.45rem; font-style: normal; }
.container-boundary { border-style: dashed; border-color: #398ae0; }
.container-boundary > small { color: #61a8f4; }
.container-boundary .process i { width: 7px; height: 7px; border-radius: 50%; background: #438fe5; animation: rv-pulse 1s infinite; }
.container-boundary .process em { color: #62a7f2; }
.mount-flow { display: grid; place-items: center; min-width: 48px; color: #776bdd; }
.mount-flow b { color: #8d83e2; font: 0.45rem/1 var(--vp-font-family-mono); text-transform: uppercase; }
.mount-flow span { font-size: 1rem; }
.artifact-card, .repo-card, .template-card { display: flex; align-items: center; gap: 0.5rem; flex: 0.8 1 0; min-width: 0; padding: 0.65rem; border: 1px solid #654dc5; border-radius: 8px; background: #151922; }
.artifact-card > i, .repo-card > i, .template-card > i { display: grid; place-items: center; flex: 0 0 auto; width: 28px; height: 28px; border-radius: 6px; background: rgba(106, 78, 206, 0.25); color: #a892ff; font-style: normal; }
.artifact-card small { color: #54c57b; }

.llm-inputs { max-width: 150px; }
.llm-node { flex: 0.9 1 0; padding: 0.7rem; border: 1px solid #397fcf; border-radius: 9px; background: #101824; }
.llm-node small, .llm-node b, .llm-node span { display: block; }
.llm-node small { color: #69a9f3; font: 0.5rem/1 var(--vp-font-family-mono); }
.llm-node b { margin-top: 0.3rem; font-size: 0.68rem; }
.llm-node span { margin-top: 0.75rem; color: #63a5ef; font: 700 0.48rem/1 var(--vp-font-family-mono); }
.llm-node span i { display: inline-block; width: 6px; height: 6px; margin-right: 0.3rem; border-radius: 50%; background: #438fe5; animation: rv-pulse 1s infinite; }
.stream-card { display: grid; flex: 1 1 0; gap: 0.25rem; padding: 0.6rem; border: 1px solid #343b49; border-radius: 8px; background: #0f141c; }
.stream-card small { color: #9a8df4; font: 700 0.47rem/1 var(--vp-font-family-mono); }
.stream-card span { overflow: hidden; color: #858e9e; font: 0.48rem/1.2 var(--vp-font-family-mono); text-overflow: ellipsis; white-space: nowrap; }
.stream-card .is-live { color: #6ca9ef; }

.repo-card { flex: 0.65 1 0; }
.agent-card { flex: 1.5 1 0; padding: 0.65rem; border: 1px solid #654dc5; border-radius: 9px; background: #111720; }
.agent-card header { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
.agent-card header span { display: flex; align-items: center; gap: 0.4rem; }
.agent-card header i { color: #9e8ff6; font-style: normal; }
.agent-card header b { font-size: 0.68rem; }
.agent-card header em { color: #8f82e8; font: 700 0.45rem/1 var(--vp-font-family-mono); font-style: normal; white-space: nowrap; }
.agent-card ul { display: grid; gap: 0.3rem; margin: 0.6rem 0 0; padding: 0; list-style: none; }
.agent-card li { display: flex; align-items: center; gap: 0.45rem; padding: 0.38rem; border: 1px solid #2c3340; border-radius: 6px; background: #0e131a; }
.agent-card li > i { display: grid; place-items: center; width: 18px; height: 18px; border-radius: 50%; color: white; font: 700 0.48rem/1 var(--vp-font-family-mono); font-style: normal; }
.agent-card li span { display: flex; justify-content: space-between; flex: 1; gap: 0.5rem; }
.agent-card li b { color: #cfd3db; font-size: 0.55rem; }
.agent-card li small { color: #727d8e; font: 0.47rem/1 var(--vp-font-family-mono); }
.agent-card li.is-done > i { background: #2f8b51; }
.agent-card li.is-active { border-color: #347ed2; }
.agent-card li.is-active b, .agent-card li.is-active small { color: #68a8f3; }

.human-task-card { flex: 1.1 1 0; padding: 0.65rem; border: 1px solid #b77b20; border-radius: 9px; background: #171711; }
.human-task-card header { display: flex; align-items: center; justify-content: space-between; gap: 0.4rem; }
.human-task-card header span { display: flex; align-items: center; gap: 0.35rem; }
.human-task-card header i { color: #efb33d; font-style: normal; }
.human-task-card header b { font-size: 0.62rem; }
.human-task-card header em { color: #e5aa37; font: 700 0.45rem/1 var(--vp-font-family-mono); font-style: normal; }
.human-task-card label { display: block; margin-top: 0.42rem; color: #858d9b; font: 0.45rem/1 var(--vp-font-family-base); }
.human-task-card label span { display: block; margin-top: 0.2rem; padding: 0.35rem; border: 1px solid #5a4824; border-radius: 5px; background: #0f1319; color: #d9dce2; font: 0.52rem/1 var(--vp-font-family-mono); }
.human-task-card button { width: 100%; margin-top: 0.45rem; padding: 0.4rem; border: 0; border-radius: 5px; background: #7257da; color: white; font: 650 0.5rem/1 var(--vp-font-family-base); pointer-events: none; }
.completed-flow { display: grid; place-items: center; min-width: 55px; color: #58c67e; }
.completed-flow b { font: 0.44rem/1 var(--vp-font-family-mono); white-space: nowrap; }
.completed-flow i { color: #57c57d; font-size: 1rem; font-style: normal; }
.template-card { border-color: #397fcf; }
.template-card small { color: #68a8f3; }
.preview-card { display: grid; flex: 1 1 0; gap: 0.28rem; min-width: 0; padding: 0.6rem; border: 1px solid #654dc5; border-radius: 8px; background: #11151d; }
.preview-card header { display: flex; align-items: center; gap: 0.35rem; margin-bottom: 0.25rem; }
.preview-card header i { color: #a18ff5; font-style: normal; }
.preview-card header b { overflow: hidden; font-size: 0.55rem; text-overflow: ellipsis; white-space: nowrap; }
.preview-card > span { overflow: hidden; color: #a3abb8; font: 0.46rem/1.25 var(--vp-font-family-mono); text-overflow: ellipsis; white-space: nowrap; }
.preview-card > span:first-of-type { color: #a18ff5; }

.nested-scene { position: relative; padding-top: 2.6rem; }
.parent-label { position: absolute; top: 0.75rem; left: 1rem; right: 1rem; display: flex; justify-content: space-between; color: #9d8df3; font: 700 0.48rem/1 var(--vp-font-family-mono); letter-spacing: 0.07em; }
.parent-label em { color: #67a8f2; font-style: normal; }
.child-boundary { flex: 1.7 1 0; padding: 0.65rem; border: 1px solid #6b57c8; border-radius: 9px; background: rgba(17, 22, 31, 0.95); }
.child-boundary > header { display: flex; align-items: center; justify-content: space-between; }
.child-boundary > header b, .child-boundary > header small { display: block; }
.child-boundary > header b { font-size: 0.68rem; }
.child-boundary > header small { margin-top: 0.18rem; color: #9185e6; font: 0.46rem/1 var(--vp-font-family-mono); }
.child-boundary > header em { color: #65a7f2; font: 700 0.46rem/1 var(--vp-font-family-mono); font-style: normal; }
.child-boundary > div { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-top: 0.55rem; }
.child-boundary .visual-node { min-width: 0; padding: 0.45rem; }
.child-boundary footer { margin-top: 0.5rem; color: #7d8798; font: 0.46rem/1 var(--vp-font-family-mono); text-align: center; }
.child-boundary footer i { margin-right: 0.25rem; color: #8f80e7; font-style: normal; }

@container (max-width: 610px) {
  .visual-body { min-height: 160px; padding: 0.7rem; }
  .graph-scene { grid-template-columns: 1fr 28px 1fr 28px 1fr; }
  .visual-node { min-width: 0; padding: 0.45rem; }
  .visual-node > i { width: 21px; height: 21px; }
  .data-scene, .container-scene, .llm-scene, .agent-scene, .human-scene, .nested-scene { gap: 0.35rem; }
  .data-inputs > span, .llm-inputs > span { padding: 0.35rem; }
  .data-inputs b, .llm-inputs b { font-size: 0.47rem; }
  .data-inputs em, .llm-inputs em { font-size: 0.42rem; }
  .visual-arrow { font-size: 0.85rem; }
  .artifact-card, .repo-card, .template-card { padding: 0.45rem; }
  .artifact-card > i, .repo-card > i, .template-card > i { width: 22px; height: 22px; }
  .artifact-card b, .repo-card b, .template-card b { font-size: 0.52rem; }
  .stream-card span:nth-of-type(2), .stream-card span:nth-of-type(3) { display: none; }
}

@container (max-width: 430px) {
  .visual-bar { padding-inline: 0.55rem; }
  .visual-body { min-height: 260px; }
  .graph-scene { grid-template-columns: 1fr 20px 1fr; grid-template-rows: auto auto; }
  .graph-scene > .visual-node:last-child { grid-column: 3; grid-row: 2; }
  .parallel-stack { grid-column: 3; grid-row: 1; }
  .fork-lines { grid-column: 2; grid-row: 1; }
  .join-lines { display: none; }
  .data-scene, .container-scene, .llm-scene, .agent-scene, .human-scene, .nested-scene { flex-wrap: wrap; align-content: center; }
  .data-scene > *, .container-scene > *, .llm-scene > *, .agent-scene > *, .human-scene > *, .nested-scene > * { flex-basis: auto; }
  .data-inputs, .llm-inputs, .boundary, .agent-card, .human-task-card, .child-boundary { width: 100%; flex: 1 0 100%; }
  .data-scene .output-card { flex: 1 1 60%; }
  .data-scene .visual-node { flex: 1 1 30%; }
  .schedule-header { grid-template-columns: 1fr 1fr; }
  .schedule-header > span:first-child { grid-column: 1 / -1; }
  .attempt-track { grid-template-columns: 1fr 18px 1fr 18px 1fr; }
  .attempt { display: grid; justify-items: center; gap: 0.25rem; padding: 0.4rem 0.2rem; text-align: center; }
  .attempt small, .track-line em { display: none; }
  .host-boundary, .container-boundary { width: calc(50% - 28px); flex: 1 1 calc(50% - 28px); }
  .container-scene .artifact-card { width: 100%; flex: 1 0 100%; }
  .llm-node { flex: 1 1 45%; }
  .stream-card { flex: 1 1 45%; }
  .llm-scene .artifact-card { flex: 1 0 100%; }
  .agent-scene .repo-card, .agent-scene .artifact-card { flex: 1 1 40%; }
  .human-scene .template-card, .human-scene .preview-card { flex: 1 1 40%; }
  .nested-scene > .visual-node { flex: 1 1 35%; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; }
}

@keyframes rv-spin { to { transform: rotate(360deg); } }
@keyframes rv-pulse { 50% { opacity: 0.45; } }
</style>
