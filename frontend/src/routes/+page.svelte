<script lang="ts">
  interface aNode {
    name: string;
      portApi: number;
      portWs: number;
      status: "dead" | "leader" | "follower" | "lost";
  }

  const sockets: {
    [key: string]: WebSocket 
  } = {}

  let nodes: {
    [key: string]: aNode
  } = {}
  
  const connectWebSocket = (newNode: aNode) => {
    if (!sockets[newNode.name] || sockets[newNode.name].readyState === WebSocket.CLOSED) {
      const socket = new WebSocket(`ws://localhost:${newNode.portWs}`)
      sockets[newNode.name] = socket

      socket.addEventListener('open', () => {
        console.log(`${newNode.name} opened connection`)
      })

      socket.addEventListener('close', (e) => {
        console.log(`${newNode.name} disconnected`)
        newNode.status = 'dead'
      })

      socket.addEventListener('error', (e) => {
        console.error(`${newNode.name} websocket error`)
        setTimeout(() => {
          console.log(`${newNode.name} attempting reconnection...`)
          connectWebSocket(newNode)
        }, 250)
      })

      socket.addEventListener('message', (e): void => {
        console.log('message received', e.data)
        switch(e.data) {
          case 'pong': {
            break;
          }
          case 'dead': {
            newNode.status = 'dead'
            break;
          }
          case 'iLead': {
            newNode.status = 'leader'
            break;
          }
          case 'found': {
            newNode.status = 'follower'
            break;
          }
          default: {
            newNode.status = 'lost'
            break;
          }
        }
        nodes = nodes
      })
    }
  }

  const newNodeConnection = (data: any) => {
    nodes[data.name] = {
      ...data,
      status: 'dead'
    }
    connectWebSocket(nodes[data.name])
  }

  const addNode = async () => {
    await fetch('http://localhost:3000/new_node')
      .then(response => response.json())
      .then(data => {
        console.log(data);
        newNodeConnection(data);        })
      .catch(error => console.log(error));
  }

  const knockOut = (name: string) => {
    sockets[name].send('pause')
  }

  setInterval(() => {
    for (const value of Object.values(sockets)) {
      if (value.readyState === WebSocket.OPEN) {
        value.send('status')
      }
    }
  }, 1000)
</script>

<main>
  <h2>Welcome to <s>the Thunderdome</s> Paxos</h2>

  <button on:click={addNode}>Add another Node</button>

  <div class="row">
    {#each Object.values(nodes) as aNode}
      {@const aStatus = aNode.status}
      {@const leader = aStatus === 'leader'}
      {@const lost = aStatus === 'lost'}
      {@const dead = aStatus === 'dead'}
      {@const follower = aStatus === 'follower'}
      <div class="child" class:leader class:lost class:dead class:follower>
        <button on:click={() => knockOut(aNode.name)}>{aNode.name}</button>
      </div>
    {/each}
  </div>
</main>

<style>
  button {
    background-color: gray;
    height: 5rem;
    width: 9rem;
    margin: 0.5rem;
  }

  .leader button {
    background-color: purple
  }

  .lost button {
    background-color: red
  }

  .dead button {
    background-color: black;
    color: white
  }

  .follower button {
    background-color: green
  }

  .row {
    text-align: center;
  }

  .child {
    display: inline-block;
    vertical-align: middle;
  }
</style>