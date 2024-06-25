<script>
  import { onMount } from "svelte";

	const sockets = [];
  const status = ['dead', 'dead', 'dead', 'dead', 'dead'];
  const nodes = [4001, 4002, 4003, 4004, 4005];

	onMount(() => {
    for (const node of nodes) {
      const socket = new WebSocket(`ws://localhost:${node}`)
		  socket.addEventListener('open', () => {
	  		console.log('Opened');
  		});

      socket.addEventListener('close', () => {
        status[node-4000] = 'dead'
      })

      socket.addEventListener('error', (e) => {
        status[node-4000] = 'dead'
      })

      socket.onmessage = (event) => {
        if (event.data === 'pong') {
          // do nothing
        } else if (event.data === 'dead') {
          status[node-4001] = 'dead'
        } else if (event.data.slice(0, 6) === 'leader') {
          if (event.data.slice(-4) === (node).toString()) {
            status[node-4001] = 'leader'
          } else {
            status[node-4001] = 'follower'
          }
        } else {
          status[node-4001] = 'lost'
        }
      }

      startPinging(socket)

      socket.onerror = (event) => {
        console.log(event)
      }

      sockets.push(socket)
      console.log(sockets)
    }

	});

  function knockOut(i) {
    sockets[i].send('pause')
  }

  function startPinging(socket) {
    const pingInterval = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send('status');
      }
    }, 250)
  }
</script>

<main>
<h2>Welcome to <s>the Thunderdome</s> Paxos</h2>

<div class="row">
  {#each Array.from(Array(5).keys()) as column (column)}
    {@const aStatus = status[column]}
    {@const lost = aStatus === 'lost'}
    {@const leader = aStatus === 'leader'}
    {@const dead = aStatus === 'dead'}
    <div class="child" class:leader class:lost class:dead>
      <button on:click={() => knockOut(column)} class:leader class:lost class:dead></button>
    </div>
  {/each}
</div>

</main>

<style>
  button {
    background-color: green;
    height: 5rem;
    width: 9rem;
    margin: 0.5rem;
  }

  .leader button {
    background-color: purple
  }

  .lost button{
    background-color: red
  }

  .dead button{
    background-color: black
  }

  .row {
    text-align: center;
  }

  .child {
    display: inline-block;
    vertical-align: middle;
  }
</style>
