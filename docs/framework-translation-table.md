# Framework Translation Table

How common UI operations map across frameworks. Each cell shows the idiomatic one-liner for that framework. Use this as a quick reference when translating existing code to bitwrench or comparing approaches.

| Operation | What it is | React | Vue 3 | Vanilla JS | Svelte 5 | Solid | Bitwrench |
|-----------|-----------|-------|-------|------------|----------|-------|-----------|
| **Render element** | Create and display a UI element | `<div className="card">Hi</div>` | `<div class="card">Hi</div>` | `el.innerHTML = '<div>Hi</div>'` | `<div class="card">Hi</div>` | `<div class="card">Hi</div>` | `bw.DOM('#x', {t:'div', a:{class:'card'}, c:'Hi'})` |
| **Update text** | Change text content after render | `setText('new')` via `useState` | `msg.value = 'new'` | `el.textContent = 'new'` | `msg = 'new'` | `setMsg('new')` | `el._bw_state.msg = 'new'; bw.update(el)` or `bw.patch(id, 'new')` |
| **Conditional render** | Show/hide based on state | `{show && <Comp/>}` | `v-if="show"` | `if (show) el.style.display = ''` | `{#if show}<Comp/>{/if}` | `<Show when={show}><Comp/></Show>` | `show ? taco : null` in `c:` array |
| **List rendering** | Render array of items | `{items.map(i => <Li key={i.id}/>)}` | `v-for="i in items" :key="i.id"` | `el.innerHTML = items.map(...)` | `{#each items as i (i.id)}` | `<For each={items}>{i => ...}</For>` | `c: items.map(function(i) { return {t:'li', c:i.name} })` |
| **Event handler** | Attach click/input handler | `onClick={handler}` | `@click="handler"` | `el.addEventListener('click', fn)` | `onclick={handler}` | `onClick={handler}` | `a: { onclick: fn }` |
| **State declaration** | Declare reactive state | `const [x, setX] = useState(0)` | `const x = ref(0)` | `let x = 0` | `let x = $state(0)` | `const [x, setX] = createSignal(0)` | `o: { state: { x: 0 } }` |
| **State update** | Change state and trigger re-render | `setX(42)` | `x.value = 42` | `x = 42; render()` | `x = 42` | `setX(42)` | `el._bw_state.x = 42; bw.update(el)` |
| **Computed / derived** | Derive value from state | `useMemo(() => x * 2, [x])` | `computed(() => x.value * 2)` | `function get() { return x * 2; }` | `let d = $derived(x * 2)` | `const d = () => x() * 2` | `c: '${x}'` with `'${x * 2}'` |
| **Side effect** | Run code on mount/change | `useEffect(() => {...}, [])` | `onMounted(() => {...})` | `window.addEventListener('load', fn)` | `$effect(() => {...})` | `onMount(() => {...})` | `o: { mounted: function(el) {...} }` |
| **Cleanup on unmount** | Tear down timers/listeners | `useEffect return cleanup` | `onUnmounted(() => {...})` | manual | `return () => {...}` in `$effect` | `onCleanup(() => {...})` | `o: { unmount: fn }` or `bw.cleanup(el)` |
| **Style inline** | Apply inline styles | `style={{color: 'red'}}` | `:style="{color: 'red'}"` | `el.style.color = 'red'` | `style="color:red"` | `style={{color: 'red'}}` | `a: { style: bw.s({ color: 'red' }) }` |
| **Style composition** | Compose/merge styles | `{...base, ...override}` | `[baseStyle, overrideStyle]` | `Object.assign({}, base, over)` | `{...base, ...override}` | `{...base, ...override}` | `bw.s({ display: 'flex' }, { padding: '1rem' }, { color: accent })` |
| **CSS class conditional** | Toggle classes | `className={active ? 'on' : ''}` | `:class="{on: active}"` | `el.classList.toggle('on')` | `class:on={active}` | `classList={{on: active()}}` | `a: { class: 'btn ' + (active ? 'on' : '') }` |
| **Generate stylesheet** | Create CSS rules in JS | styled-components / emotion | `<style scoped>` | `style.textContent = css` | `<style>` block | `` css`...` `` | `bw.injectCSS(bw.css({ '.card': { padding: '1rem' } }))` |
| **Responsive styles** | Breakpoint-based CSS | media query in CSS/styled | `@media` in `<style>` | `@media` in CSS file | `@media` in `<style>` | `@media` in CSS | `bw.responsive('.grid', { md: { columns: '1fr 1fr' } })` |
| **Animation** | CSS keyframe animation | `@keyframes` in CSS file | `@keyframes` in `<style>` | `@keyframes` in CSS | `animate:fn` or CSS | CSS or WAAPI | `bw.css({ '@keyframes fade': { '0%': {opacity:'0'}, '100%': {opacity:'1'} } })` |
| **Raw HTML** | Render unescaped HTML | `dangerouslySetInnerHTML` | `v-html="str"` | `el.innerHTML = str` | `{@html str}` | `innerHTML={str}` | `bw.raw(str)` in `c:` |
| **Cross-component events** | Decouple communication | Context + useReducer / Zustand | provide/inject or Pinia | CustomEvent / EventTarget | stores | Context or signals | `bw.pub(topic, data)` / `bw.sub(topic, fn)` |
| **Form input binding** | Read form values | `value={x} onChange={...}` | `v-model="x"` | `input.value` | `bind:value={x}` | `value={x()} onInput={...}` | `bw.$('#id')[0].value` or `bw.makeInput({oninput:fn})` |
| **Theme / design tokens** | Apply consistent theming | ThemeProvider / CSS vars | CSS vars / provide | CSS custom properties | CSS vars | CSS vars / createContext | `bw.loadStyles({ primary: '#hex' })` or `bw.makeStyles(cfg)` => `styles.palette` |
| **Build step required** | Required toolchain | Yes (Babel/Vite/webpack) | Yes (Vite or Vue CLI) | No | Yes (Svelte compiler) | Yes (Vite/Babel) | **No** |
| **Bundle size** | Shipped JS size | ~45KB (React + ReactDOM) | ~33KB (Vue 3) | 0KB | ~2KB (runtime) | ~7KB | **39KB** (includes 50+ components + CSS gen) |

---

See [Thinking in Bitwrench](thinking-in-bitwrench.md) for the full guide.
