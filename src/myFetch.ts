import fetch from 'node-fetch';
import fetchRetry from 'fetch-retry';

export const myFetch = fetchRetry(fetch);
