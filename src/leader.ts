import axios from 'axios';

export class Leader {
  leader: string | null;
  neighbors: string[];

  constructor(neighbors: string[]) {
    this.leader = null;
    this.neighbors = neighbors;
  }

  async checkLeader() {
    if (this.leader === null) {
      return false;
    }

    await axios({
      method: 'get',
      url: `http://${this.leader}:3000/`,
    })
      .then(() => {
        return true;
      })
      .catch(() => {
        this.leader = null;
        return false;
      });
  }
}
