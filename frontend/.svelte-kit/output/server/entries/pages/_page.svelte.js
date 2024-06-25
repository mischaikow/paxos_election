import { c as create_ssr_component, d as each } from "../../chunks/ssr.js";
const css = {
  code: "button.svelte-1lmhjiz.svelte-1lmhjiz{background-color:gray;height:5rem;width:9rem;margin:0.5rem}.leader.svelte-1lmhjiz button.svelte-1lmhjiz{background-color:purple\n  }.lost.svelte-1lmhjiz button.svelte-1lmhjiz{background-color:red\n  }.dead.svelte-1lmhjiz button.svelte-1lmhjiz{background-color:black\n  }.follower.svelte-1lmhjiz button.svelte-1lmhjiz{background-color:green\n  }.row.svelte-1lmhjiz.svelte-1lmhjiz{text-align:center}.child.svelte-1lmhjiz.svelte-1lmhjiz{display:inline-block;vertical-align:middle}",
  map: null
};
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let nodeData = [];
  $$result.css.add(css);
  return `<main><h2 data-svelte-h="svelte-108l63t">Welcome to <s>the Thunderdome</s> Paxos</h2> <button class="svelte-1lmhjiz" data-svelte-h="svelte-1eoibcv">Add another node</button> <div class="row svelte-1lmhjiz">${each(Array.from(Array(nodeData.length).keys()), (column) => {
    let aStatus = nodeData[column], lost = aStatus === "lost", leader = aStatus === "leader", dead = aStatus === "dead", follower = aStatus === "follower";
    return `     <div class="${[
      "child svelte-1lmhjiz",
      (leader ? "leader" : "") + " " + (lost ? "lost" : "") + " " + (dead ? "dead" : "") + " " + (follower ? "follower" : "")
    ].join(" ").trim()}"><button class="${[
      "svelte-1lmhjiz",
      (leader ? "leader" : "") + " " + (lost ? "lost" : "") + " " + (dead ? "dead" : "") + " " + (follower ? "follower" : "")
    ].join(" ").trim()}"></button> </div>`;
  })}</div> </main>`;
});
export {
  Page as default
};
