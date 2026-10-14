import { Worker } from "node:worker_threads";
import { createRequire } from "node:module";
import { Pool } from "pg";

// Keep the existing synchronous, atomic coordinator contract. Network I/O runs
// on a dedicated worker, with one bounded connection and transaction per worker.
// This deliberately limits throughput; it is not a horizontally scaled engine.
export class PostgresDatabase {
  private buffer = new SharedArrayBuffer(8 * 1024 * 1024);
  private worker: Worker;
  private failed = false;
  private closed = false;
  private inTransaction = false;
  private waitTimeoutMs = 15000;
  constructor(private connectionString: string) {
    this.worker = this.createWorker();
  }
  private createWorker() {
    // A terminated worker may still finish writing: never reuse its reply buffer.
    this.buffer = new SharedArrayBuffer(8 * 1024 * 1024);
    const worker = new Worker(`
      const {parentPort,workerData}=require('node:worker_threads');
      const {Client,types}=require(workerData.pg);
      types.setTypeParser(20, Number);
      let client,broken=false,inTransaction=false;
      function connect(){
        broken=false;
        client=new Client({connectionString:workerData.url,statement_timeout:12000,connectionTimeoutMillis:12000});
        client.on('error',()=>{broken=true;});
        return client.connect().catch(e=>{broken=true;throw e;});
      }
      let ready=connect();ready.catch(()=>{});
      parentPort.on('message',async ({sql,params})=>{
        const header=new Int32Array(workerData.buffer,0,2);
        let result;
        try {
          if(broken && inTransaction){
            if(/^ROLLBACK$/i.test(sql)){inTransaction=false;result={rows:[],changes:0};}
            else throw Object.assign(new Error(),{code:'CONNECTION_LOST_IN_TRANSACTION'});
          }
          if(!result){
            if(broken){void client.end().catch(()=>{});ready=connect();}
            await ready;const q=await client.query(sql,params);
            if(/^BEGIN$/i.test(sql))inTransaction=true;
            if(/^(COMMIT|ROLLBACK)$/i.test(sql))inTransaction=false;
            result={rows:q.rows??[],changes:q.rowCount??0};
          }
        }
        catch(e){if(!e.code || /^(08|57P|ECONN|EPIPE)/.test(e.code))broken=true;result={error:e.code??'DATABASE_UNAVAILABLE'};}
        const bytes=Buffer.from(JSON.stringify(result));
        if(bytes.length>workerData.buffer.byteLength-8){const b=Buffer.from('{"error":"RESULT_TOO_LARGE"}');new Uint8Array(workerData.buffer,8,b.length).set(b);Atomics.store(header,1,b.length);}
        else {new Uint8Array(workerData.buffer,8,bytes.length).set(bytes);Atomics.store(header,1,bytes.length);}
        Atomics.store(header,0,1);Atomics.notify(header,0);
      });
    `, { eval: true, execArgv: [], workerData: { url: this.connectionString, buffer: this.buffer, pg: createRequire(import.meta.url).resolve("pg") } });
    worker.unref();
    return worker;
  }
  private sql(source: string) {
    let index = 0;
    let sql = source.replace(/'[^']*(?:''[^']*)*'|\?/g, part => part === "?" ? `$${++index}` : part);
    sql = sql.replace(/\buserId\b/g, '"userId"').replace(/\bisAnonymous\s*=\s*0/g, '"isAnonymous"=false')
      .replace(/\bFROM user\b/g, 'FROM "user"').replace(/\bAS gameId\b/g, 'AS "gameId"').replace(/\bAS startedAt\b/g, 'AS "startedAt"')
      .replace(/MAX\(started_at,excluded.started_at\)/g, 'GREATEST(gv_recent.started_at,excluded.started_at)');
    if (/INSERT OR IGNORE/i.test(sql)) sql = sql.replace(/INSERT OR IGNORE/i, 'INSERT') + ' ON CONFLICT DO NOTHING';
    return sql;
  }
  query(sql: string, params: unknown[] = []) {
    if (this.closed) throw Error("Database connection closed");
    if (this.failed) {
      // The failed operation is never replayed. Abandon its transaction first;
      // terminating the old connection rolls back any uncommitted work.
      if (/^ROLLBACK$/i.test(sql)) {
        this.inTransaction = false;
        return { rows: [], changes: 0 };
      }
      if (this.inTransaction) throw Error("Database transaction lost; rollback required");
      this.worker = this.createWorker();
      this.failed = false;
    }
    const header = new Int32Array(this.buffer, 0, 2);
    Atomics.store(header, 0, 0);
    this.worker.postMessage({ sql: this.sql(sql), params });
    if (Atomics.wait(header, 0, 0, this.waitTimeoutMs) === "timed-out") {
      this.failed = true; void this.worker.terminate();
      throw Error("Database operation timed out");
    }
    const value = JSON.parse(Buffer.from(new Uint8Array(this.buffer, 8, Atomics.load(header, 1))).toString());
    if (value.error) throw Error(`Database operation failed (${value.error})`);
    if (/^BEGIN$/i.test(sql)) this.inTransaction = true;
    if (/^(COMMIT|ROLLBACK)$/i.test(sql)) this.inTransaction = false;
    return value;
  }
  prepare(sql: string) {
    return {
      all: (...args: any[]): any[] => this.query(sql, args).rows,
      get: (...args: any[]): any => this.query(sql, args).rows[0],
      run: (...args: any[]): any => this.query(sql, args),
    };
  }
  exec(sql: string) { this.query(sql); }
  close() { this.closed = true; void this.worker.terminate(); }
}

export const postgresPool = (connectionString: string) => new Pool({ connectionString, max: 2, connectionTimeoutMillis: 12000, idleTimeoutMillis: 10000 });
