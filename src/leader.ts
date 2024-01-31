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
    try {
      await fetch(`http://${this.leader}:3000/`, {
        method: 'GET',
      });
      return true;
    } catch (error) {
      this.leader = null;
      return false;
    }
    return false;
  }
}
