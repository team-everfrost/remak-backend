declare module 'pgvector/utils' {
  export function toSql(vector: number[]): string;

  export function fromSql(value: any): any;
}
