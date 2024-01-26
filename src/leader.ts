import axios from 'axios';

export class Leader {
  leader: string | null;
  neighbors: string[];
  leaderSearch: boolean;

  constructor(neighbors: string[]) {
    this.leader = null;
    this.neighbors = neighbors;
    this.leaderSearch = false;
  }

  async checkLeader(): Promise<boolean> {
    if (this.leaderSearch) {
      return true;
    }

    console.log(`Checking leadership - ${this.leader}`);
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
    return false;
  }
}
